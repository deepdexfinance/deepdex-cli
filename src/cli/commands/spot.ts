/**
 * Spot trading commands
 */

import BigNumber from "bignumber.js";
import { consola } from "consola";
import { formatUnits, type Hex, parseUnits } from "viem";
import { network } from "../../abis/config.ts";
import { loadConfig } from "../../config/index.ts";
import {
	findMarket,
	getOraclePrices,
	getUserSubaccounts,
	placeSpotBuyOrder,
	placeSpotMarketBuy,
	placeSpotMarketSell,
	placeSpotSellOrder,
} from "../../services/client.ts";
import {
	getAccount,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { dim, formatSide, formatToSize } from "../../utils/format.ts";
import { confirm, promptPassword } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * Execute a spot buy order
 */
export async function buy(args: ParsedArgs): Promise<void> {
	await executeSpotOrder("buy", args);
}

/**
 * Execute a spot sell order
 */
export async function sell(args: ParsedArgs): Promise<void> {
	await executeSpotOrder("sell", args);
}

/**
 * Execute a spot order (buy or sell)
 */
async function executeSpotOrder(
	side: "buy" | "sell",
	args: ParsedArgs,
): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const pair = requireArg(args.positional, 0, "pair");
	const amount = requireArg(args.positional, 1, "amount");
	const price = getFlag<string>(args.raw, "price");
	const postOnly = getFlag<boolean>(args.raw, "post-only") || false;
	const reduceOnly = getFlag<boolean>(args.raw, "reduce-only") || false;
	const config = loadConfig();
	const accountName =
		getFlag<string>(args.raw, "account") || config.default_account || "main";

	// Find market
	const market = findMarket(pair);
	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (market.isPerp) {
		throw new Error(
			`${pair} is a perpetual market. Use 'deepdex perp' for perpetual trading.`,
		);
	}

	const finalAmount = formatToSize(amount, market.stepSize);
	const finalPrice = price ? formatToSize(price, market.tickSize) : undefined;

	const orderType = finalPrice ? "limit" : "market";
	const _sideColor = side === "buy" ? "\x1b[32m" : "\x1b[31m";
	const _resetColor = "\x1b[0m";

	console.log();
	consola.box({
		title: `📈 Spot ${side.toUpperCase()}`,
		message: `Market: ${market.value}
Size: ${finalAmount} ${market.tokens[0]?.symbol || ""}
Type: ${orderType.toUpperCase()}
${finalPrice ? `Price: $${finalPrice}` : ""}
${postOnly ? "Post-Only: Yes" : ""}
${reduceOnly ? "Reduce-Only: Yes" : ""}
Account: ${accountName}`,
		style: {
			padding: 1,
			borderColor: side === "buy" ? "green" : "red",
			borderStyle: "rounded",
		},
	});

	// Confirm if not dry-run or --yes
	if (!args.flags.dryRun && !args.flags.yes) {
		console.log();
		const confirmed = await confirm(`Execute ${formatSide(side)} order?`, true);
		if (!confirmed) {
			consola.info("Order cancelled.");
			return;
		}
	}

	if (args.flags.dryRun) {
		console.log();
		consola.info("DRY RUN - Order not submitted");
		return;
	}

	consola.start("Submitting order...");

	let txHash: Hex;

	try {
		const account = getAccount();
		const subaccounts = await getUserSubaccounts(account.address);
		const subaccount = subaccounts.find((s) => s.name === accountName);

		if (!subaccount) {
			throw new Error(
				`Subaccount '${accountName}' not found. Create it first with 'deepdex account create ${accountName}'`,
			);
		}

		const baseToken = market.tokens[0];
		const quoteToken = market.tokens[1];

		if (!baseToken || !quoteToken) {
			throw new Error("Invalid market configuration: missing tokens");
		}

		const baseAmount = parseUnits(finalAmount, baseToken.decimals);
		let quoteAmount = 0n;

		if (finalPrice) {
			// Limit Order
			const amountBN = new BigNumber(finalAmount);
			const priceBN = new BigNumber(finalPrice);
			const quoteBN = amountBN.times(priceBN);

			quoteAmount = parseUnits(
				quoteBN.toFixed(quoteToken.decimals),
				quoteToken.decimals,
			);

			if (side === "buy") {
				txHash = await placeSpotBuyOrder({
					subaccount: subaccount.address,
					pairId: market.pairId as Hex,
					quoteAmount,
					baseAmount,
					postOnly: postOnly ? 1 : 0,
					reduceOnly,
				});
			} else {
				txHash = await placeSpotSellOrder({
					subaccount: subaccount.address,
					pairId: market.pairId as Hex,
					quoteAmount,
					baseAmount,
					postOnly: postOnly ? 1 : 0,
					reduceOnly,
				});
			}
		} else {
			// Market Order
			const prices = await getOraclePrices();
			const oraclePrice = prices.find(
				(p) => p.symbol === baseToken.symbol,
			)?.price;
			if (!oraclePrice) {
				// Fallback to market.price if oracle not found, though risky
				const marketPrice = new BigNumber(market.price || "0");
				if (marketPrice.isZero()) {
					throw new Error("Could not determine market price for market order");
				}
				// Use market price
				const slippage = new BigNumber(0.05); // 5%
				const amountBN = new BigNumber(finalAmount);

				const estimatedQuote =
					side === "buy"
						? amountBN.times(marketPrice).times(slippage.plus(1))
						: amountBN
								.times(marketPrice)
								.times(new BigNumber(1).minus(slippage));

				quoteAmount = parseUnits(
					formatToSize(estimatedQuote, market.stepSize),
					quoteToken.decimals,
				);
			} else {
				// Use oracle price
				const priceBN = new BigNumber(formatUnits(oraclePrice, 6));
				const slippage = new BigNumber(0.05); // 5%
				const amountBN = new BigNumber(finalAmount);

				const estimatedQuote =
					side === "buy"
						? amountBN.times(priceBN).times(slippage.plus(1))
						: amountBN.times(priceBN).times(new BigNumber(1).minus(slippage));

				quoteAmount = parseUnits(
					formatToSize(estimatedQuote, market.stepSize),
					quoteToken.decimals,
				);
			}

			if (side === "buy") {
				txHash = await placeSpotMarketBuy({
					subaccount: subaccount.address,
					pairId: market.pairId as Hex,
					quoteAmount,
					baseAmount,
					autoCancel: true,
					reduceOnly,
				});
			} else {
				txHash = await placeSpotMarketSell({
					subaccount: subaccount.address,
					pairId: market.pairId as Hex,
					quoteAmount,
					baseAmount,
					autoCancel: true,
					reduceOnly,
				});
			}
		}
	} catch (error) {
		consola.error(error);
		return;
	}

	const orderId = txHash;

	console.log();
	consola.success(
		`${orderType === "market" ? "Order executed!" : "Order placed!"}`,
	);
	console.log();
	console.log(dim("  Order ID:  ") + orderId);
	const explorerUrl = `${network.explorer}/tx/${txHash}`;
	console.log(dim(`  Transaction: ${explorerUrl}`));
	console.log(
		dim("  Status:    ") + (orderType === "market" ? "Filled" : "Open"),
	);
	if (orderType === "limit") {
		console.log(
			`${dim("  Tip:       ")}Use 'deepdex order list' to check status`,
		);
	}
	console.log();
}

// ============================================================================
// Helpers
// ============================================================================

function ensureWallet(): void {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}
}

async function ensureUnlocked(): Promise<void> {
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}
}
