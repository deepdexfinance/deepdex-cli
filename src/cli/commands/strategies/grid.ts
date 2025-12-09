import BigNumber from "bignumber.js";
import { consola } from "consola";
import { formatUnits, type Hex, parseUnits } from "viem";
import {
	findMarket,
	getOraclePrices,
	getSubaccountBalance,
	getUserSpotOrders,
	getUserSubaccounts,
	placeSpotBuyOrder,
	placeSpotSellOrder,
} from "../../../services/client.ts";
import { getAccount } from "../../../services/wallet.ts";
import type { BotConfig } from "../../../types/index.ts";
import { PRICE_DECIMALS } from "../../../utils/constants.ts";
import { formatToSize } from "../../../utils/format.ts";

/**
 * Run the Grid Trading strategy
 *
 * Places buy and sell orders at fixed intervals.
 *
 * @example
 * ```json
 * {
 *   "strategy": "grid",
 *   "config": {
 *     "pair": "BTC-USDT",
 *     "lowerPrice": "60000",
 *     "upperPrice": "70000",
 *     "grids": 10,
 *     "amountPerGrid": "0.001"
 *   }
 * }
 * ```
 */
export async function run(config: BotConfig): Promise<void> {
	const { pair, lowerPrice, upperPrice, grids, amountPerGrid } =
		config.config as {
			pair: string;
			lowerPrice: string;
			upperPrice: string;
			grids: number;
			amountPerGrid: string;
		};

	if (!pair || !lowerPrice || !upperPrice || !grids || !amountPerGrid) {
		throw new Error(
			"Missing required config: pair, lowerPrice, upperPrice, grids, amountPerGrid",
		);
	}

	const market = findMarket(pair);
	if (!market) throw new Error(`Market not found: ${pair} `);

	consola.info(`Starting Grid Strategy for ${pair}`);
	consola.info(`Range: ${lowerPrice} - ${upperPrice} `);
	consola.info(`Grids: ${grids}, Amount: ${amountPerGrid} `);

	const account = getAccount();
	const subaccounts = await getUserSubaccounts(account.address);
	const subaccount = subaccounts.find((s) => s.name === config.account);
	if (!subaccount) throw new Error(`Subaccount '${config.account}' not found`);

	const baseToken = market.tokens[0];
	const quoteToken = market.tokens[1];

	if (!baseToken || !quoteToken) {
		throw new Error(`Market ${pair} does not have valid base / quote tokens`);
	}

	// Calculate grid levels
	const low = new BigNumber(lowerPrice);
	const high = new BigNumber(upperPrice);
	const step = high.minus(low).div(grids);

	const levels: BigNumber[] = [];
	for (let i = 0; i <= grids; i++) {
		levels.push(low.plus(step.times(i)));
	}

	consola.info(
		`Grid levels calculated: ${levels.map((l) => l.toFixed(2)).join(", ")} `,
	);

	// Main loop
	while (true) {
		try {
			const prices = await getOraclePrices();
			const currentPriceObj = prices.find((p) => p.symbol === baseToken.symbol);
			if (!currentPriceObj) throw new Error("Price not available");

			// Oracle price is 6 decimals
			const currentPrice = new BigNumber(currentPriceObj.price.toString()).div(
				1e6,
			);

			consola.info(`Current Price: ${currentPrice.toFixed(4)} `);

			// Check active orders
			const activeOrders = await getUserSpotOrders(
				subaccount.address,
				market.pairId as Hex,
			);

			// Simple logic: If no orders, place them.
			// In a real bot, we would check which grids are filled and re-place them.
			// Here we just ensure we have orders around the price.

			if (activeOrders.length === 0) {
				consola.start("Placing initial grid orders...");

				// Inventory Skewing
				// Max theoretical inventory is roughly grids * amountPerGrid (if we bought everything)
				// We target 50% inventory.
				const baseBalance = await getSubaccountBalance(
					subaccount.address,
					baseToken.symbol,
				);
				const currentInventory = Number(
					formatUnits(baseBalance, baseToken.decimals),
				);
				const maxInventory = grids * Number(amountPerGrid);

				// Ratio: 0 (empty) -> 1 (full)
				// We clamp it between 0 and 1 just in case
				const ratio = Math.min(Math.max(currentInventory / maxInventory, 0), 1);

				// Skew Factor: How much to shift the grid?
				// If ratio > 0.5 (Too much inventory), we want to shift DOWN to sell faster/buy lower.
				// If ratio < 0.5 (Too little inventory), we want to shift UP to buy faster/sell higher.
				// Shift = (Ratio - 0.5) * Factor
				// e.g. Ratio 0.8 -> (0.3) * 0.1 = 0.03 (3% shift down) -> Price * (1 - 0.03)
				const SKEW_INTENSITY = 0.05; // Max 5% shift
				const skew = (ratio - 0.5) * 2 * SKEW_INTENSITY;

				consola.info(
					`Inventory: ${currentInventory.toFixed(4)}/${maxInventory.toFixed(4)} (${(ratio * 100).toFixed(1)}%)`,
				);
				consola.info(
					`Skew: ${(skew * 100).toFixed(2)}% (Shift ${skew > 0 ? "DOWN" : "UP"})`,
				);

				for (const rawLevel of levels) {
					// Apply skew
					const level = rawLevel.times(1 - skew);

					// Don't place order too close to current price to avoid immediate fill (taker)
					if (level.minus(currentPrice).abs().div(currentPrice).lt(0.005))
						continue;

					const priceStr = formatToSize(level.toString(), market.tickSize);
					const _priceBN = parseUnits(priceStr, PRICE_DECIMALS);
					// Wait, spot limit order takes price?
					// placeSpotBuyOrder args: quoteAmount, baseAmount. It implies price = quote / base.
					// Actually, let's check placeSpotBuyOrder in client.ts.
					// It takes quoteAmount and baseAmount.
					// So for Limit Buy at Price P:
					// Base Amount = B
					// Quote Amount = B * P

					const amountStr = formatToSize(amountPerGrid, market.stepSize);

					const baseAmountBN = parseUnits(amountStr, baseToken.decimals);

					const quoteAmountBN = parseUnits(
						new BigNumber(amountStr).times(level).toFixed(quoteToken.decimals),
						quoteToken.decimals,
					);

					if (level.lt(currentPrice)) {
						// Buy Order
						await placeSpotBuyOrder({
							subaccount: subaccount.address,
							pairId: market.pairId as Hex,
							quoteAmount: quoteAmountBN,
							baseAmount: baseAmountBN,
							postOnly: 1, // Post only
							reduceOnly: false,
						});
						consola.success(`Placed Buy at ${level.toFixed(2)}`);
					} else {
						// Sell Order
						await placeSpotSellOrder({
							subaccount: subaccount.address,
							pairId: market.pairId as Hex,
							quoteAmount: quoteAmountBN,
							baseAmount: baseAmountBN,
							postOnly: 1,
							reduceOnly: false,
						});
						consola.success(`Placed Sell at ${level.toFixed(2)}`);
					}

					// Sleep to avoid rate limits
					await new Promise((r) => setTimeout(r, 500));
				}
			} else {
				consola.info(`${activeOrders.length} active orders. Monitoring...`);
			}
		} catch (error) {
			consola.error("Grid loop error:", error);
		}

		await new Promise((r) => setTimeout(r, 10000)); // 10s interval
	}
}
