/**
 * Perpetual trading commands
 */

import { consola } from "consola";
import { formatUnits, parseUnits } from "viem";
import { network } from "../../abis/config.ts";
import { loadConfig } from "../../config/index.ts";
import {
	findMarket,
	getFreeDeposit,
	getOraclePrices,
	getPublicClient,
	getUserSubaccounts,
	placePerpOrder,
} from "../../services/client.ts";
import {
	getAccount,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import {
	MAX_LEVERAGE,
	PRICE_DECIMALS,
	USDC_DECIMALS,
} from "../../utils/constants.ts";
import {
	dim,
	formatLeverage,
	formatSide,
	formatToSize,
} from "../../utils/format.ts";
import { confirm, getPassword } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * Open a long position
 */
export async function long(args: ParsedArgs): Promise<void> {
	await executePerpOrder("long", args);
}

/**
 * Open a short position
 */
export async function short(args: ParsedArgs): Promise<void> {
	await executePerpOrder("short", args);
}

/**
 * Execute a perpetual order
 */
async function executePerpOrder(
	side: "long" | "short",
	args: ParsedArgs,
): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const pair = requireArg(args.positional, 0, "pair");
	const amountStr = requireArg(args.positional, 1, "amount");
	const leverage =
		getFlag<number>(args.raw, "lev") ||
		getFlag<number>(args.raw, "leverage") ||
		1;
	const price = getFlag<string>(args.raw, "price");
	const tp = getFlag<string>(args.raw, "tp");
	const sl = getFlag<string>(args.raw, "sl");
	const reduceOnly = getFlag<boolean>(args.raw, "reduce-only") || false;
	const config = loadConfig();
	const accountName =
		getFlag<string>(args.raw, "account") || config.default_account || "default";

	// Find market
	const market = findMarket(pair);
	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (!market.tokens[0]) {
		throw new Error("Invalid market configuration: missing base token");
	}

	if (!market.isPerp) {
		throw new Error(
			`${pair} is a spot market. Use 'deepdex spot' for spot trading.`,
		);
	}

	// Validate leverage
	if (leverage < 1 || leverage > MAX_LEVERAGE) {
		throw new Error(`Leverage must be between 1 and ${MAX_LEVERAGE}`);
	}

	if (market.leverage && leverage > market.leverage) {
		throw new Error(`Max leverage for ${pair} is ${market.leverage}x`);
	}

	// Get subaccount for percentage calculation
	const account = getAccount();
	const subaccounts = await getUserSubaccounts(account.address);
	const subaccount = subaccounts.find((s) => s.name === accountName);

	if (!subaccount) {
		throw new Error(`Subaccount '${accountName}' not found.`);
	}

	// Fetch oracle price (needed for percentage calculation and market orders)
	const oraclePrices = await getOraclePrices();
	const baseSymbol = market.tokens[0]?.symbol || "";
	const oraclePrice = oraclePrices.find(
		(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
	)?.price;

	if (!oraclePrice) {
		throw new Error(
			`Could not determine oracle price for ${baseSymbol}. Cannot place order.`,
		);
	}

	// Handle percentage-based amount
	let finalAmount: string;
	let _isPercentage = false;

	if (amountStr.endsWith("%")) {
		_isPercentage = true;
		const percentage = Number.parseFloat(amountStr.slice(0, -1));
		if (Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
			throw new Error("Invalid percentage. Must be between 0 and 100.");
		}

		// Get available margin (free deposit)
		const freeDeposit = await getFreeDeposit(subaccount.address);
		if (freeDeposit === 0n) {
			throw new Error("No available margin in subaccount.");
		}

		// Calculate position value: (freeDeposit * percentage / 100) * leverage
		const marginToUse =
			(freeDeposit * BigInt(Math.round(percentage * 100))) / 10000n;
		const positionValue = marginToUse * BigInt(leverage);

		// Convert position value to base asset amount: positionValue / oraclePrice
		// positionValue is in USDC (6 decimals), oraclePrice is in PRICE_DECIMALS (6)
		// Result should be in base token decimals
		const baseDecimals = market.tokens[0].decimals;
		// positionValue (USD with 6 decimals) / price (with 6 decimals) = amount with baseDecimals
		const positionSize =
			(positionValue * 10n ** BigInt(baseDecimals)) / oraclePrice;

		finalAmount = formatToSize(
			formatUnits(positionSize, baseDecimals),
			market.stepSize,
		);

		const marginUsedStr = formatUnits(marginToUse, USDC_DECIMALS);
		console.log(
			dim(
				`  ${amountStr} of margin ($${marginUsedStr}) × ${leverage}x = ${finalAmount} ${baseSymbol}`,
			),
		);
	} else {
		finalAmount = formatToSize(amountStr, market.stepSize);
	}

	// Determine price for order
	let finalPrice: string;
	if (price) {
		finalPrice = formatToSize(price, market.tickSize);
	} else {
		// Market order: use oracle price
		finalPrice = formatToSize(
			formatUnits(oraclePrice, PRICE_DECIMALS),
			market.tickSize,
		);
	}

	const finalTp = tp ? formatToSize(tp, market.tickSize) : undefined;
	const finalSl = sl ? formatToSize(sl, market.tickSize) : undefined;

	const orderType = price ? "limit" : "market";

	console.log();
	consola.box({
		title: `📊 Perpetual ${side.toUpperCase()}`,
		message: `Market: ${market.value}
Size: ${finalAmount} ${market.tokens[0]?.symbol || ""}
Leverage: ${formatLeverage(leverage)}
Type: ${orderType.toUpperCase()}
${price ? `Price: $${finalPrice}` : `Oracle Price: $${finalPrice}`}
${finalTp ? `Take Profit: $${finalTp}` : ""}
${finalSl ? `Stop Loss: $${finalSl}` : ""}
${reduceOnly ? "Reduce-Only: Yes" : ""}
Account: ${accountName}`,
		style: {
			padding: 1,
			borderColor: side === "long" ? "green" : "red",
			borderStyle: "rounded",
		},
	});

	// Risk warning for high leverage
	if (leverage >= 10) {
		console.log();
		consola.warn(`High leverage(${leverage}x) increases liquidation risk!`);
	}

	// Confirm if not dry-run or --yes
	if (!args.flags.dryRun && !args.flags.yes) {
		console.log();
		const confirmed = await confirm(
			`Open ${formatSide(side)} position ? `,
			true,
		);
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

	consola.start("Opening position...");

	try {
		const marketId = Number.parseInt(market.pairId, 10);
		const isLong = side === "long";
		const sizeBigInt = parseUnits(finalAmount, market.tokens[0].decimals);

		let priceBigInt = 0n;
		if (finalPrice) {
			// All prices use PRICE_DECIMALS (6)
			priceBigInt = parseUnits(finalPrice, PRICE_DECIMALS);
		}

		const tpBigInt = finalTp ? parseUnits(finalTp, PRICE_DECIMALS) : 0n;
		const slBigInt = finalSl ? parseUnits(finalSl, PRICE_DECIMALS) : 0n;
		const hash = await placePerpOrder({
			subaccount: subaccount.address,
			marketId,
			isLong,
			size: sizeBigInt,
			price: priceBigInt,
			orderType: price ? 1 : 0,
			leverage,
			takeProfit: tpBigInt,
			stopLoss: slBigInt,
			reduceOnly,
			postOnly: 0,
		});

		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		if (args.flags.json) {
			const result = {
				success: true,
				txHash: hash,
				pair: market.value,
				side,
				type: orderType,
				amount: finalAmount,
				price: finalPrice || "market",
				leverage,
				status: orderType === "market" ? "filled" : "open",
			};
			console.log(JSON.stringify(result, null, 2));
			return;
		}

		console.log();
		consola.success(`${side.toUpperCase()} position opened!`);
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log(
			dim("  Status:      ") + (orderType === "market" ? "Filled" : "Open"),
		);
		console.log();
		console.log(dim("  View: deepdex position list"));
		console.log();
	} catch (error) {
		if (args.flags.json) {
			console.log(JSON.stringify({ error: (error as Error).message }, null, 2));
			return;
		}
		consola.error(`Failed to open position: ${(error as Error).message}`);
	}
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
		const password = await getPassword();
		await unlockWallet(password);
	}
}
