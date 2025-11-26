/**
 * Spot trading commands
 */

import type { Hex } from "viem";
import { parseUnits } from "viem";
import {
	findMarket,
	getUserSubaccounts,
	placeSpotBuyOrder,
	placeSpotMarketBuy,
	placeSpotMarketSell,
	placeSpotSellOrder,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { USDC_DECIMALS } from "../../utils/constants.ts";
import {
	bold,
	dim,
	error,
	formatSide,
	info,
	success,
	truncateAddress,
} from "../../utils/format.ts";
import { confirm, keyValue, promptPassword, spinner } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * Execute spot buy order
 */
export async function buy(args: ParsedArgs): Promise<void> {
	await executeSpotOrder(args, "buy");
}

/**
 * Execute spot sell order
 */
export async function sell(args: ParsedArgs): Promise<void> {
	await executeSpotOrder(args, "sell");
}

/**
 * Common spot order execution
 */
async function executeSpotOrder(
	args: ParsedArgs,
	side: "buy" | "sell",
): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	// Parse arguments
	const pair = requireArg(args.positional, 0, "pair");
	const amountStr = requireArg(args.positional, 1, "amount");
	const priceStr = getFlag<string | number>(args.raw, "price");
	const postOnly = getFlag<boolean>(args.raw, "post-only") || false;
	const reduceOnly = getFlag<boolean>(args.raw, "reduce-only") || false;
	const accountName = getFlag<string>(args.raw, "account");

	// Validate market
	const market = findMarket(pair);
	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (market.isPerp) {
		throw new Error(
			`${pair} is a perpetual market. Use 'deepdex perp ${side === "buy" ? "long" : "short"}' instead.`,
		);
	}

	// Validate amount
	const amount = Number.parseFloat(amountStr);
	if (Number.isNaN(amount) || amount <= 0) {
		throw new Error("Invalid amount");
	}

	// Determine order type
	const isMarketOrder = priceStr === undefined;
	const price = priceStr ? Number.parseFloat(String(priceStr)) : 0;

	if (!isMarketOrder && (Number.isNaN(price) || price <= 0)) {
		throw new Error("Invalid price");
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

	// Display order preview
	console.log();
	console.log(
		bold(
			`📝 ${isMarketOrder ? "Market" : "Limit"} ${side.toUpperCase()} Order`,
		),
	);
	console.log();
	console.log(
		keyValue(
			{
				Market: market.value,
				Side: formatSide(side),
				Amount: `${amount} ${market.tokens[0]?.symbol}`,
				...(isMarketOrder ? {} : { Price: `$${price}` }),
				Type: isMarketOrder ? "Market" : "Limit",
				Account: subaccount.name,
				...(postOnly ? { "Post Only": "Yes" } : {}),
				...(reduceOnly ? { "Reduce Only": "Yes" } : {}),
			},
			2,
		),
	);

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
	const baseDecimals = market.tokens[0]?.decimals || 18;
	const baseAmount = parseUnits(amountStr, baseDecimals);
	const quoteAmount = isMarketOrder
		? 0n
		: parseUnits((amount * price).toFixed(USDC_DECIMALS), USDC_DECIMALS);

	const pairId = market.pairId as Hex;

	// Execute order
	const spin = spinner("Placing order...");
	spin.start();

	try {
		let txHash: Hex;

		if (isMarketOrder) {
			if (side === "buy") {
				txHash = await placeSpotMarketBuy({
					subaccount: subaccount.address,
					pairId,
					quoteAmount,
					baseAmount,
					autoCancel: true,
					reduceOnly,
				});
			} else {
				txHash = await placeSpotMarketSell({
					subaccount: subaccount.address,
					pairId,
					quoteAmount,
					baseAmount,
					autoCancel: true,
					reduceOnly,
				});
			}
		} else {
			if (side === "buy") {
				txHash = await placeSpotBuyOrder({
					subaccount: subaccount.address,
					pairId,
					quoteAmount,
					baseAmount,
					postOnly: postOnly ? 1 : 0,
					reduceOnly,
				});
			} else {
				txHash = await placeSpotSellOrder({
					subaccount: subaccount.address,
					pairId,
					quoteAmount,
					baseAmount,
					postOnly: postOnly ? 1 : 0,
					reduceOnly,
				});
			}
		}

		spin.stop(success("Order placed successfully!"));
		console.log(dim(`  Transaction: ${truncateAddress(txHash)}`));
	} catch (err) {
		spin.stop(error("Failed to place order"));
		throw err;
	}

	console.log();
}
