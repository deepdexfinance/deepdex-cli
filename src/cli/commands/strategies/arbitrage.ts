import BigNumber from "bignumber.js";
import { consola } from "consola";
import { type Hex, parseUnits } from "viem";
import { loadConfig } from "../../../config/index.ts";
import {
	closePosition,
	findMarket,
	getPerpMarket,
	getSubaccountBalance,
	getUserPerpPositions,
	getUserSubaccounts,
	placePerpOrder,
	placeSpotMarketBuy,
	placeSpotMarketSell,
} from "../../../services/client.ts";
import { getAccount } from "../../../services/wallet.ts";
import type { BotConfig } from "../../../types/index.ts";
import { formatToSize } from "../../../utils/format.ts";

/**
 * Run the Funding Rate Arbitrage Strategy
 *
 * Exploits positive funding rates by Shorting Perp and Buying Spot (Delta Neutral).
 *
 * @example
 * ```json
 * {
 *   "strategy": "arbitrage",
 *   "config": {
 *     "spotPair": "BTC-USDT",
 *     "perpPair": "BTC-PERP",
 *     "minFundingRate": "0.01",
 *     "amount": "1000"
 *   }
 * }
 * ```
 */
export async function run(config: BotConfig): Promise<void> {
	const { spotPair, perpPair, minFundingRate, amount } = config.config as {
		spotPair: string;
		perpPair: string;
		minFundingRate: string;
		amount: string;
	};

	if (!spotPair || !perpPair || !minFundingRate || !amount) {
		throw new Error(
			"Missing required config: spotPair, perpPair, minFundingRate, amount",
		);
	}

	const spotMarket = findMarket(spotPair);
	const perpMarketInfo = findMarket(perpPair);

	if (!spotMarket) throw new Error(`Spot Market not found: ${spotPair}`);
	if (!perpMarketInfo || !perpMarketInfo.isPerp)
		throw new Error(`Perp Market not found: ${perpPair}`);

	consola.info(`Starting Arbitrage Strategy`);
	consola.info(`Spot: ${spotPair}, Perp: ${perpPair}`);
	consola.info(`Min Funding: ${minFundingRate}%, Amount: $${amount}`);

	const account = getAccount();
	const subaccounts = await getUserSubaccounts(account.address);
	const subaccount = subaccounts.find((s) => s.name === config.account);
	if (!subaccount) throw new Error(`Subaccount '${config.account}' not found`);

	const perpMarketId = Number(perpMarketInfo.pairId);

	// Main loop
	while (true) {
		try {
			const marketData = await getPerpMarket(perpMarketId);
			if (!marketData) throw new Error("Failed to fetch perp market data");

			// Funding Rate
			// Assuming 1e18 scaling for rate? Or 1e6?
			// Let's assume 1e18. 0.01% = 0.0001
			const fundingRateBN = new BigNumber(
				marketData.funding_rate.toString(),
			).div(1e18);
			const fundingRatePct = fundingRateBN.times(100);

			consola.info(`Current Funding Rate: ${fundingRatePct.toFixed(4)}%`);

			// Check positions
			const positions = await getUserPerpPositions(subaccount.address, [
				perpMarketId,
			]);
			const perpPos = positions[0];

			const hasPosition = !!perpPos && perpPos.base_asset_amount > 0n;

			if (!hasPosition) {
				if (fundingRatePct.gt(minFundingRate)) {
					consola.start("Funding rate high! Opening Arbitrage...");

					// Split capital 50/50
					const tradeAmount = new BigNumber(amount).div(2);

					// 1. Buy Spot
					// We need to calculate base amount for spot? Or use quote amount.
					// spotMarket.tokens[1] is Quote (USDT).
					const quoteToken = spotMarket.tokens[1];
					if (!quoteToken) throw new Error("Spot market missing quote token");
					const quoteAmountBN = parseUnits(
						tradeAmount.toString(),
						quoteToken.decimals,
					);

					consola.info(`Buying $${tradeAmount.toFixed(2)} Spot...`);
					await placeSpotMarketBuy({
						subaccount: subaccount.address,
						pairId: spotMarket.pairId as Hex,
						quoteAmount: quoteAmountBN,
						baseAmount: 0n,
						autoCancel: true,
						reduceOnly: false,
					});

					// 2. Short Perp (1x)
					// We need price to calculate size.
					const oraclePrice = marketData.oracle_price;
					if (!oraclePrice) throw new Error("Oracle price not available");
					const price = new BigNumber(oraclePrice.toString()).div(1e6);
					const size = tradeAmount.div(price);
					const sizeStr = formatToSize(
						size.toString(),
						perpMarketInfo.stepSize,
					);
					const baseToken = perpMarketInfo.tokens[0];
					if (!baseToken) throw new Error("Perp market missing base token");
					const sizeBN = parseUnits(sizeStr, baseToken.decimals);

					consola.info(`Shorting ${sizeStr} Perp...`);
					await placePerpOrder({
						subaccount: subaccount.address,
						marketId: perpMarketId,
						isLong: false,
						size: sizeBN,
						price: oraclePrice, // Oracle price for market orders
						orderType: 0, // Market
						leverage: 1,
						takeProfit: 0n,
						stopLoss: 0n,
						reduceOnly: false,
						postOnly: 0,
					});

					consola.success("Arbitrage Opened!");
				} else {
					consola.info("Funding rate too low. Waiting...");
				}
			} else {
				// We have a position. Check exit.
				// Exit if funding drops below 0 or some threshold?
				if (fundingRatePct.lt(0)) {
					consola.start("Funding rate negative! Closing Arbitrage...");

					// 1. Close Perp
					consola.info("Closing Perp Short...");
					const userConfig = loadConfig();
					const slippageBps = BigInt(
						Math.round((userConfig.trading.max_slippage || 0.5) * 100),
					);
					const closingOraclePrice = marketData.oracle_price;
					if (!closingOraclePrice)
						throw new Error("Oracle price not available");
					await closePosition(
						subaccount.address,
						perpMarketId,
						closingOraclePrice,
						slippageBps,
					);

					// 2. Sell Spot
					const baseToken = spotMarket.tokens[0];
					if (!baseToken) throw new Error("Spot market missing base token");

					const spotBalance = await getSubaccountBalance(
						subaccount.address,
						baseToken.symbol,
					);

					if (spotBalance > 0n) {
						consola.info(
							`Selling Spot Balance: ${formatToSize(
								spotBalance.toString(),
								spotMarket.stepSize,
							)}...`,
						);
						await placeSpotMarketSell({
							subaccount: subaccount.address,
							pairId: spotMarket.pairId as Hex,
							quoteAmount: 0n,
							baseAmount: spotBalance,
							autoCancel: true,
							reduceOnly: false,
						});
						consola.success("Spot Sold!");
					} else {
						consola.warn("No spot balance found to sell.");
					}
				} else {
					consola.info("Arbitrage active. earning funding...");
				}
			}
		} catch (error) {
			consola.error("Arbitrage loop error:", error);
		}

		await new Promise((r) => setTimeout(r, 60000)); // 1 min interval
	}
}
