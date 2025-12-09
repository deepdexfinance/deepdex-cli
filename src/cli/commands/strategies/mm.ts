import BigNumber from "bignumber.js";
import { consola } from "consola";
import { formatUnits, type Hex, parseUnits } from "viem";
import {
	cancelSpotOrder,
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
import { formatToSize } from "../../../utils/format.ts";

/**
 * Run the Market Making strategy
 *
 * Provides liquidity by placing buy and sell orders on both sides of the
 * order book, profiting from the bid-ask spread.
 *
 * @example
 * ```json
 * {
 *   "strategy": "mm",
 *   "config": {
 *     "pair": "BTC-USDT",
 *     "spread": "0.002",
 *     "orderSize": "0.01",
 *     "levels": 3,
 *     "levelSpacing": "0.001",
 *     "refreshInterval": 5000
 *   }
 * }
 * ```
 */
export async function run(config: BotConfig): Promise<void> {
	const {
		pair,
		spread = "0.002",
		orderSize,
		levels = 3,
		levelSpacing = "0.001",
		refreshInterval = 5000,
		inventoryTarget = 0.5,
		maxSkew = 0.03,
	} = config.config as {
		pair: string;
		spread?: string;
		orderSize: string;
		levels?: number;
		levelSpacing?: string;
		refreshInterval?: number;
		inventoryTarget?: number;
		maxSkew?: number;
	};

	if (!pair || !orderSize) {
		throw new Error("Missing required config: pair, orderSize");
	}

	const market = findMarket(pair);
	if (!market) throw new Error(`Market not found: ${pair}`);

	consola.info(`Starting Market Making Strategy for ${pair}`);
	consola.info(`Spread: ${(Number(spread) * 100).toFixed(2)}%`);
	consola.info(`Order Size: ${orderSize}`);
	consola.info(`Levels: ${levels}, Level Spacing: ${levelSpacing}`);
	consola.info(`Refresh Interval: ${refreshInterval}ms`);

	const account = getAccount();
	const subaccounts = await getUserSubaccounts(account.address);
	const subaccount = subaccounts.find((s) => s.name === config.account);
	if (!subaccount) throw new Error(`Subaccount '${config.account}' not found`);

	const baseToken = market.tokens[0];
	const quoteToken = market.tokens[1];

	if (!baseToken || !quoteToken) {
		throw new Error(`Market ${pair} does not have valid base/quote tokens`);
	}

	const spreadBN = new BigNumber(spread);
	const levelSpacingBN = new BigNumber(levelSpacing);

	// Main loop
	while (true) {
		try {
			// Get current price
			const prices = await getOraclePrices();
			const currentPriceObj = prices.find((p) => p.symbol === baseToken.symbol);
			if (!currentPriceObj) throw new Error("Price not available");

			// Oracle price is 6 decimals
			const midPrice = new BigNumber(currentPriceObj.price.toString()).div(1e6);

			consola.info(`Mid Price: ${midPrice.toFixed(4)}`);

			// Calculate inventory skew
			const baseBalance = await getSubaccountBalance(
				subaccount.address,
				baseToken.symbol,
			);
			const quoteBalance = await getSubaccountBalance(
				subaccount.address,
				quoteToken.symbol,
			);

			const baseValue = new BigNumber(
				formatUnits(baseBalance, baseToken.decimals),
			);
			const quoteValue = new BigNumber(
				formatUnits(quoteBalance, quoteToken.decimals),
			);

			// Calculate inventory ratio (base value / total value)
			const baseValueInQuote = baseValue.times(midPrice);
			const totalValue = baseValueInQuote.plus(quoteValue);
			const inventoryRatio = totalValue.isZero()
				? new BigNumber(0.5)
				: baseValueInQuote.div(totalValue);

			consola.info(
				`Inventory: Base=${baseValue.toFixed(4)}, Quote=${quoteValue.toFixed(2)}`,
			);
			consola.info(
				`Inventory Ratio: ${(inventoryRatio.toNumber() * 100).toFixed(1)}% (target: ${inventoryTarget * 100}%)`,
			);

			// Calculate skew adjustment
			// If we have too much base, we want to sell more aggressively (lower ask, higher bid spread)
			// If we have too little base, we want to buy more aggressively (lower bid, higher ask spread)
			const inventoryDeviation = inventoryRatio.minus(inventoryTarget);
			const skewAdjustment = BigNumber.min(
				BigNumber.max(inventoryDeviation.times(2), -maxSkew),
				maxSkew,
			);

			consola.info(
				`Skew Adjustment: ${(skewAdjustment.toNumber() * 100).toFixed(2)}%`,
			);

			// Cancel existing orders before placing new ones
			const existingOrders = await getUserSpotOrders(
				subaccount.address,
				market.pairId as Hex,
			);

			if (existingOrders.length > 0) {
				consola.info(`Cancelling ${existingOrders.length} existing orders...`);
				for (const order of existingOrders) {
					try {
						await cancelSpotOrder(
							subaccount.address,
							market.pairId as Hex,
							order.id,
							order.is_buy,
						);
					} catch (err) {
						consola.warn(`Failed to cancel order ${order.id}:`, err);
					}
				}
				// Wait for cancellation to process
				await new Promise((r) => setTimeout(r, 1000));
			}

			// Place orders at multiple levels
			consola.start("Placing market making orders...");

			for (let i = 0; i < levels; i++) {
				// Calculate price offset for this level
				const levelOffset = levelSpacingBN.times(i);

				// Bid price: mid - spread/2 - levelOffset - skewAdjustment
				const bidPrice = midPrice
					.times(1 - spreadBN.div(2).toNumber() - levelOffset.toNumber())
					.times(1 - skewAdjustment.toNumber());

				// Ask price: mid + spread/2 + levelOffset - skewAdjustment
				const askPrice = midPrice
					.times(1 + spreadBN.div(2).toNumber() + levelOffset.toNumber())
					.times(1 - skewAdjustment.toNumber());

				const orderSizeBN = new BigNumber(orderSize);
				const baseAmountBN = parseUnits(
					formatToSize(orderSize, market.stepSize),
					baseToken.decimals,
				);

				// Place buy order
				const bidQuoteAmount = orderSizeBN.times(bidPrice);
				const bidQuoteAmountBN = parseUnits(
					bidQuoteAmount.toFixed(quoteToken.decimals),
					quoteToken.decimals,
				);

				try {
					await placeSpotBuyOrder({
						subaccount: subaccount.address,
						pairId: market.pairId as Hex,
						quoteAmount: bidQuoteAmountBN,
						baseAmount: baseAmountBN,
						postOnly: 1,
						reduceOnly: false,
					});
					consola.success(`Bid L${i + 1}: ${bidPrice.toFixed(4)}`);
				} catch (error) {
					consola.warn(`Failed to place bid L${i + 1}:`, error);
				}

				// Place sell order
				const askQuoteAmount = orderSizeBN.times(askPrice);
				const askQuoteAmountBN = parseUnits(
					askQuoteAmount.toFixed(quoteToken.decimals),
					quoteToken.decimals,
				);

				try {
					await placeSpotSellOrder({
						subaccount: subaccount.address,
						pairId: market.pairId as Hex,
						quoteAmount: askQuoteAmountBN,
						baseAmount: baseAmountBN,
						postOnly: 1,
						reduceOnly: false,
					});
					consola.success(`Ask L${i + 1}: ${askPrice.toFixed(4)}`);
				} catch (error) {
					consola.warn(`Failed to place ask L${i + 1}:`, error);
				}

				// Small delay between orders
				await new Promise((r) => setTimeout(r, 200));
			}

			consola.success(
				`Placed ${levels * 2} orders (${levels} bids, ${levels} asks)`,
			);
		} catch (error) {
			consola.error("Market making loop error:", error);
		}

		// Wait before refreshing quotes
		consola.info(`Waiting ${refreshInterval}ms before refresh...`);
		await new Promise((r) => setTimeout(r, refreshInterval));
	}
}
