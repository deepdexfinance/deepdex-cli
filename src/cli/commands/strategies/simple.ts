import BigNumber from "bignumber.js";
import { consola } from "consola";
import { formatUnits, type Hex, parseUnits } from "viem";
import {
	findMarket,
	getOraclePrices,
	getUserSubaccounts,
	placeSpotMarketBuy,
} from "../../../services/client.ts";
import { getAccount } from "../../../services/wallet.ts";
import type { BotConfig } from "../../../types/index.ts";
import { formatToSize } from "../../../utils/format.ts";

/**
 * Parse duration string to milliseconds
 * e.g. "1h" -> 3600000
 */
function parseDuration(duration: string | number): number {
	if (typeof duration === "number") return duration;
	if (typeof duration !== "string") {
		throw new Error(`Invalid duration type: ${typeof duration}`);
	}

	const match = duration.match(/^(\d+)([smhd])$/);
	if (!match) {
		throw new Error(
			`Invalid duration format: ${duration}. Use format like '1h', '30m', '10s'`,
		);
	}

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
 * Run the simple DCA strategy
 *
 * This strategy executes Dollar Cost Averaging (DCA) by purchasing a specified
 * amount of a token at regular time intervals.
 *
 * @example
 * ```json
 * {
 *   "strategy": "simple",
 *   "account": "main",
 *   "config": {
 *     "pair": "BTC-USDT",
 *     "amount": "0.001",
 *     "interval": "1h",
 *     "amountType": "base"
 *   }
 * }
 * ```
 */
export async function run(config: BotConfig): Promise<void> {
	const { pair, amount, interval } = config.config as {
		pair: string;
		amount: string;
		interval: string | number;
	};

	if (!pair || !amount || !interval) {
		throw new Error(
			"Missing required config for simple strategy: pair, amount, interval",
		);
	}

	const intervalMs = parseDuration(interval);
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	consola.info(`Starting Simple DCA Strategy`);
	consola.info(`Pair: ${pair}`);
	consola.info(`Amount: ${amount}`);
	consola.info(`Interval: ${interval} (${intervalMs}ms)`);
	console.log();

	// Main loop
	while (true) {
		try {
			consola.start(`Executing DCA buy for ${pair}...`);

			const account = getAccount();
			const subaccounts = await getUserSubaccounts(account.address);
			const subaccount = subaccounts.find((s) => s.name === config.account);

			if (!subaccount) {
				throw new Error(`Subaccount '${config.account}' not found`);
			}

			const baseToken = market.tokens[0];
			const quoteToken = market.tokens[1];

			if (!baseToken || !quoteToken) {
				throw new Error("Invalid market configuration");
			}

			// Calculate quote amount (market buy)
			// We need to estimate the quote amount based on current price + slippage
			const _prices = await getOraclePrices();

			let quoteAmount = 0n;

			const amountType = config.config.amountType || "base";

			let txHash: Hex;

			if (amountType === "quote") {
				// Fixed Quote Amount (e.g. 100 USDT)
				const quoteAmountBN = parseUnits(amount, quoteToken.decimals);
				txHash = await placeSpotMarketBuy({
					subaccount: subaccount.address,
					pairId: market.pairId as Hex,
					quoteAmount: quoteAmountBN,
					baseAmount: 0n,
					autoCancel: true,
					reduceOnly: false,
				});
			} else {
				// Fixed Base Amount (e.g. 0.1 BTC)
				const baseAmountBN = parseUnits(amount, baseToken.decimals);

				const prices = await getOraclePrices();
				const oraclePrice = prices.find(
					(p) => p.symbol === baseToken.symbol,
				)?.price;

				if (!oraclePrice) {
					// Fallback to market price
					const marketPrice = new BigNumber(market.price || "0");
					if (marketPrice.isZero()) throw new Error("No price available");

					const slippage = new BigNumber(0.05);
					const amountBN = new BigNumber(amount);
					const estimatedQuote = amountBN
						.times(marketPrice)
						.times(slippage.plus(1));

					quoteAmount = parseUnits(
						formatToSize(estimatedQuote, market.stepSize),
						quoteToken.decimals,
					);
				} else {
					// Oracle price is 6 decimals
					// formatUnits(oraclePrice, 6) -> string
					const priceBN = new BigNumber(formatUnits(oraclePrice, 6));
					const slippage = new BigNumber(0.05);
					const amountBN = new BigNumber(amount);
					const estimatedQuote = amountBN
						.times(priceBN)
						.times(slippage.plus(1));

					quoteAmount = parseUnits(
						formatToSize(estimatedQuote, market.stepSize),
						quoteToken.decimals,
					);
				}

				txHash = await placeSpotMarketBuy({
					subaccount: subaccount.address,
					pairId: market.pairId as Hex,
					quoteAmount: quoteAmount,
					baseAmount: baseAmountBN,
					autoCancel: true,
					reduceOnly: false,
				});
			}

			consola.success(`Buy order executed! Tx: ${txHash}`);
		} catch (error) {
			consola.error(`Failed to execute buy:`, error);
		}

		consola.info(`Waiting ${interval} for next buy...`);
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
}
