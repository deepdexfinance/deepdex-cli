import BigNumber from "bignumber.js";
import { consola } from "consola";
import { parseUnits } from "viem";
import { loadConfig } from "../../../config/index.ts";
import {
	closePosition,
	findMarket,
	getOraclePrices,
	getUserPerpPositions,
	getUserSubaccounts,
	placePerpOrder,
} from "../../../services/client.ts";
import { getAccount } from "../../../services/wallet.ts";
import type { BotConfig } from "../../../types/index.ts";
import { formatToSize } from "../../../utils/format.ts";

function parseDuration(duration: string | number): number {
	if (typeof duration === "number") return duration;
	if (typeof duration !== "string")
		throw new Error(`Invalid duration type: ${typeof duration}`);
	const match = duration.match(/^(\d+)([smhd])$/);
	if (!match) throw new Error(`Invalid duration format: ${duration}`);
	const value = parseInt(match[1]!, 10);
	const unit = match[2]!;
	switch (unit) {
		case "s":
			return value * 1000;
		case "m":
			return value * 60 * 1000;
		case "h":
			return value * 60 * 60 * 1000;
		case "d":
			return value * 24 * 60 * 60 * 1000;
		default:
			return value;
	}
}

/**
 * Run the Momentum Strategy
 *
 * Trend following strategy using Moving Average (MA).
 *
 * @example
 * ```json
 * {
 *   "strategy": "momentum",
 *   "config": {
 *     "pair": "ETH-PERP",
 *     "interval": "15m",
 *     "period": 20,
 *     "leverage": 2,
 *     "amount": "100"
 *   }
 * }
 * ```
 */
export async function run(config: BotConfig): Promise<void> {
	const { pair, interval, period, leverage, amount } = config.config as {
		pair: string;
		interval: string;
		period: number;
		leverage: number;
		amount: string;
	};

	if (!pair || !interval || !period || !leverage || !amount) {
		throw new Error(
			"Missing required config: pair, interval, period, leverage, amount",
		);
	}

	const market = findMarket(pair);
	if (!market || !market.isPerp)
		throw new Error(`Perp Market not found: ${pair}`);

	const baseToken = market.tokens[0];
	if (!baseToken) throw new Error(`Base token not found for market ${pair}`);

	const intervalMs = parseDuration(interval);

	consola.info(`Starting Momentum Strategy for ${pair}`);
	consola.info(`Interval: ${interval}, Period: ${period} (MA)`);
	consola.info(`Leverage: ${leverage}x, Amount: $${amount}`);

	const account = getAccount();
	const subaccounts = await getUserSubaccounts(account.address);
	const subaccount = subaccounts.find((s) => s.name === config.account);
	if (!subaccount) throw new Error(`Subaccount '${config.account}' not found`);

	const prices: BigNumber[] = [];
	const marketId = Number(market.pairId);

	// Main loop
	while (true) {
		try {
			const oraclePrices = await getOraclePrices();
			const priceObj = oraclePrices.find((p) => p.symbol === baseToken.symbol);
			if (!priceObj) throw new Error("Price not available");

			const currentPrice = new BigNumber(priceObj.price.toString()).div(1e6); // 6 decimals
			prices.push(currentPrice);

			// Keep only needed history
			if (prices.length > period) {
				prices.shift();
			}

			consola.info(
				`Price: ${currentPrice.toFixed(4)} | History: ${prices.length}/${period}`,
			);

			if (prices.length === period) {
				// Calculate MA
				const sum = prices.reduce((a, b) => a.plus(b), new BigNumber(0));
				const ma = sum.div(period);

				consola.info(`MA(${period}): ${ma.toFixed(4)}`);

				// Check positions
				const positions = await getUserPerpPositions(subaccount.address, [
					marketId,
				]);
				const position = positions[0];

				const isLong = currentPrice.gt(ma);
				const isShort = currentPrice.lt(ma);

				if (isLong) {
					// Signal: LONG
					if (position && !position.is_long) {
						// Close Short
						consola.info("Signal LONG. Closing Short...");
						const userConfig = loadConfig();
						const slippageBps = BigInt(
							Math.round((userConfig.trading.max_slippage || 0.5) * 100),
						);
						await closePosition(
							subaccount.address,
							marketId,
							priceObj.price,
							slippageBps,
						); // Market close
					}

					if (!position || !position.is_long) {
						// Open Long
						consola.info("Opening LONG...");
						const size = new BigNumber(amount).div(currentPrice);
						const sizeStr = formatToSize(size.toString(), market.stepSize);

						const sizeBN = parseUnits(sizeStr, baseToken.decimals);

						await placePerpOrder({
							subaccount: subaccount.address,
							marketId,
							isLong: true,
							size: sizeBN,
							price: priceObj.price, // Oracle price for market orders
							orderType: 0, // Market
							leverage,
							takeProfit: 0n,
							stopLoss: 0n,
							reduceOnly: false,
							postOnly: 0,
						});
						consola.success("Opened LONG");
					}
				} else if (isShort) {
					// Signal: SHORT
					if (position?.is_long) {
						// Close Long
						consola.info("Signal SHORT. Closing Long...");
						const userConfig = loadConfig();
						const slippageBps = BigInt(
							Math.round((userConfig.trading.max_slippage || 0.5) * 100),
						);
						await closePosition(
							subaccount.address,
							marketId,
							priceObj.price,
							slippageBps,
						);
					}

					if (!position || position.is_long) {
						// Open Short
						consola.info("Opening SHORT...");
						const size = new BigNumber(amount).div(currentPrice);
						const sizeStr = formatToSize(size.toString(), market.stepSize);

						const sizeBN = parseUnits(sizeStr, baseToken.decimals);

						await placePerpOrder({
							subaccount: subaccount.address,
							marketId,
							isLong: false,
							size: sizeBN,
							price: priceObj.price, // Oracle price for market orders
							orderType: 0, // Market
							leverage,
							takeProfit: 0n,
							stopLoss: 0n,
							reduceOnly: false,
							postOnly: 0,
						});
						consola.success("Opened SHORT");
					}
				}
			} else {
				consola.info("Collecting data...");
			}
		} catch (error) {
			consola.error("Momentum loop error:", error);
		}

		await new Promise((r) => setTimeout(r, intervalMs));
	}
}
