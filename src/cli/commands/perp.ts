/**
 * Perpetual trading commands
 */

import { parseUnits } from "viem";
import { loadConfig } from "../../config/index.ts";
import {
	findMarket,
	getOraclePrices,
	getUserSubaccounts,
	placePerpOrder,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import {
	MAX_LEVERAGE,
	ORDER_TYPES,
	PRICE_DECIMALS,
} from "../../utils/constants.ts";
import {
	bold,
	dim,
	error,
	formatAmount,
	formatLeverage,
	formatSide,
	info,
	success,
	truncateAddress,
} from "../../utils/format.ts";
import { confirm, keyValue, promptPassword, spinner } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * Open long position
 */
export async function long(args: ParsedArgs): Promise<void> {
	await executePerpOrder(args, true);
}

/**
 * Open short position
 */
export async function short(args: ParsedArgs): Promise<void> {
	await executePerpOrder(args, false);
}

/**
 * Common perpetual order execution
 */
async function executePerpOrder(
	args: ParsedArgs,
	isLong: boolean,
): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const config = loadConfig();

	// Parse arguments
	const pair = requireArg(args.positional, 0, "pair");
	const amountStr = requireArg(args.positional, 1, "amount");
	const priceStr = getFlag<string | number>(args.raw, "price");
	const leverageStr =
		getFlag<string | number>(args.raw, "lev") ||
		getFlag<string | number>(args.raw, "leverage");
	const tpStr = getFlag<string | number>(args.raw, "tp");
	const slStr = getFlag<string | number>(args.raw, "sl");
	const reduceOnly = getFlag<boolean>(args.raw, "reduce-only") || false;
	const postOnly = getFlag<boolean>(args.raw, "post-only") || false;
	const accountName = getFlag<string>(args.raw, "account");

	// Validate market
	const market = findMarket(pair);
	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (!market.isPerp) {
		throw new Error(
			`${pair} is a spot market. Use 'deepdex spot ${isLong ? "buy" : "sell"}' instead.`,
		);
	}

	// Validate amount
	const amount = Number.parseFloat(amountStr);
	if (Number.isNaN(amount) || amount <= 0) {
		throw new Error("Invalid amount");
	}

	// Validate leverage
	const leverage = leverageStr
		? Number.parseInt(String(leverageStr), 10)
		: config.trading.default_leverage;

	if (leverage < 1 || leverage > MAX_LEVERAGE) {
		throw new Error(`Leverage must be between 1 and ${MAX_LEVERAGE}`);
	}

	if (leverage > market.leverage) {
		throw new Error(`Maximum leverage for ${pair} is ${market.leverage}x`);
	}

	// Determine order type
	const isMarketOrder = priceStr === undefined;
	const price = priceStr ? Number.parseFloat(String(priceStr)) : 0;

	if (!isMarketOrder && (Number.isNaN(price) || price <= 0)) {
		throw new Error("Invalid price");
	}

	// Parse TP/SL
	const takeProfit = tpStr ? Number.parseFloat(String(tpStr)) : 0;
	const stopLoss = slStr ? Number.parseFloat(String(slStr)) : 0;

	// Validate TP/SL logic
	if (takeProfit > 0 && stopLoss > 0) {
		if (isLong) {
			if (takeProfit <= stopLoss) {
				throw new Error(
					"Take-profit must be above stop-loss for long positions",
				);
			}
		} else {
			if (takeProfit >= stopLoss) {
				throw new Error(
					"Take-profit must be below stop-loss for short positions",
				);
			}
		}
	}

	// Unlock wallet
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	// Get subaccount
	const address = getStoredAddress()!;
	const subaccounts = await getUserSubaccounts(address);

	let subaccount = subaccounts[0];
	if (accountName) {
		subaccount = subaccounts.find(
			(s) => s.name.toLowerCase() === accountName.toLowerCase(),
		);
		if (!subaccount) {
			throw new Error(`Subaccount not found: ${accountName}`);
		}
	}

	if (!subaccount) {
		throw new Error(
			"No subaccount found. Create one with: deepdex account create",
		);
	}

	// Get current oracle price for market orders
	let displayPrice = price;
	if (isMarketOrder) {
		const oraclePrices = await getOraclePrices();
		const baseSymbol = market.tokens[0]?.symbol || "";
		const oracle = oraclePrices.find(
			(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
		);
		if (oracle) {
			displayPrice = Number(formatAmount(oracle.price, PRICE_DECIMALS, 2));
		}
	}

	// Display order preview
	console.log();
	console.log(
		bold(
			`📝 ${isMarketOrder ? "Market" : "Limit"} ${isLong ? "LONG" : "SHORT"} Order`,
		),
	);
	console.log();

	const orderInfo: Record<string, string> = {
		Market: market.value,
		Side: formatSide(isLong ? "long" : "short"),
		Size: `${amount} ${market.tokens[0]?.symbol}`,
		Leverage: formatLeverage(leverage),
		Type: isMarketOrder ? "Market" : "Limit",
		Account: subaccount.name,
	};

	if (!isMarketOrder) {
		orderInfo["Limit Price"] = `$${price}`;
	} else if (displayPrice) {
		orderInfo["Est. Price"] = `~$${displayPrice}`;
	}

	if (takeProfit > 0) {
		orderInfo["Take Profit"] = `$${takeProfit}`;
	}
	if (stopLoss > 0) {
		orderInfo["Stop Loss"] = `$${stopLoss}`;
	}
	if (reduceOnly) {
		orderInfo["Reduce Only"] = "Yes";
	}
	if (postOnly) {
		orderInfo["Post Only"] = "Yes";
	}

	console.log(keyValue(orderInfo, 2));

	// Calculate notional value
	const notional = amount * (displayPrice || 0);
	const margin = notional / leverage;
	if (notional > 0) {
		console.log();
		console.log(dim(`  Notional: ~$${notional.toFixed(2)}`));
		console.log(dim(`  Required Margin: ~$${margin.toFixed(2)}`));
	}

	// Confirm if not --yes
	if (!args.flags.yes && !args.flags.dryRun) {
		console.log();
		const confirmed = await confirm("Execute this order?", true);
		if (!confirmed) {
			console.log(info("Order cancelled."));
			return;
		}
	}

	// Dry run
	if (args.flags.dryRun) {
		console.log();
		console.log(info("[Dry Run] Order would be placed with above parameters"));
		return;
	}

	// Calculate order parameters
	const marketId = Number.parseInt(market.pairId, 10);
	const baseDecimals = market.tokens[0]?.decimals || 18;
	const size = parseUnits(amountStr, baseDecimals);

	// For market orders, use 0 price with slippage
	const orderPrice = isMarketOrder
		? 0n
		: parseUnits(price.toFixed(market.priceDecimal), PRICE_DECIMALS);

	const tpPrice =
		takeProfit > 0
			? parseUnits(takeProfit.toFixed(market.priceDecimal), PRICE_DECIMALS)
			: 0n;

	const slPrice =
		stopLoss > 0
			? parseUnits(stopLoss.toFixed(market.priceDecimal), PRICE_DECIMALS)
			: 0n;

	const orderType = isMarketOrder ? ORDER_TYPES.MARKET : ORDER_TYPES.LIMIT;

	// Execute order
	const spin = spinner("Placing order...");
	spin.start();

	try {
		const txHash = await placePerpOrder({
			subaccount: subaccount.address,
			marketId,
			isLong,
			size,
			price: orderPrice,
			orderType,
			leverage,
			takeProfit: tpPrice,
			stopLoss: slPrice,
			reduceOnly,
			postOnly: postOnly ? 1 : 0,
		});

		spin.stop(success("Order placed successfully!"));
		console.log(dim(`  Transaction: ${truncateAddress(txHash)}`));
	} catch (err) {
		spin.stop(error("Failed to place order"));
		throw err;
	}

	console.log();
}
