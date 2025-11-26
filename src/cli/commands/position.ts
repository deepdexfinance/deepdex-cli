/**
 * Position management commands
 */

import { parseUnits } from "viem";
import { perpPairs } from "../../abis/config.ts";
import {
	closePosition,
	findMarket,
	getOraclePrices,
	getUserPerpPositions,
	getUserSubaccounts,
	modifyTpSl,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import {
	DEFAULT_SLIPPAGE_BPS,
	PRICE_DECIMALS,
	USDC_DECIMALS,
} from "../../utils/constants.ts";
import {
	bold,
	dim,
	error,
	formatAmount,
	formatLeverage,
	formatPnL,
	formatSide,
	info as infoMsg,
	success,
	truncateAddress,
} from "../../utils/format.ts";
import {
	confirm,
	keyValue,
	promptPassword,
	spinner,
	table,
} from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * List all open positions
 */
export async function list(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;
	const accountFilter = getFlag<string>(args.raw, "account");

	const spin = spinner("Fetching positions...");
	spin.start();

	// Get subaccounts
	const subaccounts = await getUserSubaccounts(address);

	// Filter if specified
	const targetAccounts = accountFilter
		? subaccounts.filter(
				(s) => s.name.toLowerCase() === accountFilter.toLowerCase(),
			)
		: subaccounts;

	// Get market IDs
	const marketIds = perpPairs
		.filter((p) => !p.disabled)
		.map((p) => Number.parseInt(p.pairId, 10));

	// Get oracle prices
	const oraclePrices = await getOraclePrices();

	// Collect all positions
	const allPositions: {
		account: string;
		subaccountAddress: string;
		market: string;
		marketId: number;
		isLong: boolean;
		size: bigint;
		entryPrice: bigint;
		currentPrice: bigint;
		leverage: number;
		unrealizedPnl: bigint;
		liquidationPrice: bigint;
		takeProfit: bigint;
		stopLoss: bigint;
	}[] = [];

	for (const sub of targetAccounts) {
		const positions = await getUserPerpPositions(sub.address, marketIds);

		for (const pos of positions) {
			if (pos.baseAssetAmount === 0n) continue;

			const market = perpPairs.find(
				(p) => Number.parseInt(p.pairId, 10) === pos.marketId,
			);
			const marketName = market?.value || `Perp-${pos.marketId}`;
			const baseSymbol = market?.tokens[0]?.symbol || "";

			// Get current price
			const oracle = oraclePrices.find(
				(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
			);
			const currentPrice = oracle?.price || pos.entryPrice;

			// Calculate unrealized P&L
			const priceDiff = currentPrice - pos.entryPrice;
			const unrealizedPnl = pos.isLong
				? (pos.baseAssetAmount * priceDiff) / 10n ** BigInt(PRICE_DECIMALS)
				: (pos.baseAssetAmount * -priceDiff) / 10n ** BigInt(PRICE_DECIMALS);

			allPositions.push({
				account: sub.name,
				subaccountAddress: sub.address,
				market: marketName,
				marketId: pos.marketId,
				isLong: pos.isLong,
				size: pos.baseAssetAmount,
				entryPrice: pos.entryPrice,
				currentPrice,
				leverage: pos.leverage,
				unrealizedPnl,
				liquidationPrice: pos.liquidatePrice,
				takeProfit: pos.takeProfit,
				stopLoss: pos.stopLoss,
			});
		}
	}

	spin.stop("");

	if (allPositions.length === 0) {
		console.log(infoMsg("No open positions."));
		return;
	}

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				allPositions.map((p) => ({
					...p,
					size: p.size.toString(),
					entryPrice: p.entryPrice.toString(),
					currentPrice: p.currentPrice.toString(),
					unrealizedPnl: p.unrealizedPnl.toString(),
					liquidationPrice: p.liquidationPrice.toString(),
					takeProfit: p.takeProfit.toString(),
					stopLoss: p.stopLoss.toString(),
				})),
				null,
				2,
			),
		);
		return;
	}

	console.log(bold("\n📊 Open Positions\n"));

	const tableData = allPositions.map((pos) => ({
		Market: pos.market,
		Account: pos.account,
		Side: formatSide(pos.isLong ? "long" : "short"),
		Size: formatAmount(pos.size, 18, 4),
		Entry: `$${formatAmount(pos.entryPrice, PRICE_DECIMALS, 2)}`,
		Current: `$${formatAmount(pos.currentPrice, PRICE_DECIMALS, 2)}`,
		uPnL: formatPnL(pos.unrealizedPnl, USDC_DECIMALS),
		Lev: formatLeverage(pos.leverage),
		Liq: `$${formatAmount(pos.liquidationPrice, PRICE_DECIMALS, 2)}`,
	}));

	console.log(
		table(
			[
				{ header: "Market", key: "Market" },
				{ header: "Account", key: "Account" },
				{ header: "Side", key: "Side" },
				{ header: "Size", key: "Size", align: "right" },
				{ header: "Entry", key: "Entry", align: "right" },
				{ header: "Current", key: "Current", align: "right" },
				{ header: "uPnL", key: "uPnL", align: "right" },
				{ header: "Lev", key: "Lev", align: "right" },
				{ header: "Liq", key: "Liq", align: "right" },
			],
			tableData,
		),
	);
}

/**
 * Display position info
 */
export async function info(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const marketArg = requireArg(args.positional, 0, "market");
	const market = findMarket(marketArg);

	if (!market) {
		throw new Error(`Market not found: ${marketArg}`);
	}

	if (!market.isPerp) {
		throw new Error("Position info is only available for perpetual markets");
	}

	const address = getStoredAddress()!;
	const accountFilter = getFlag<string>(args.raw, "account");

	const spin = spinner("Fetching position...");
	spin.start();

	const subaccounts = await getUserSubaccounts(address);
	const targetAccounts = accountFilter
		? subaccounts.filter(
				(s) => s.name.toLowerCase() === accountFilter.toLowerCase(),
			)
		: subaccounts;

	const marketId = Number.parseInt(market.pairId, 10);
	const oraclePrices = await getOraclePrices();
	const baseSymbol = market.tokens[0]?.symbol || "";
	const oracle = oraclePrices.find(
		(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
	);

	let foundPosition = null;
	let accountName = "";

	for (const sub of targetAccounts) {
		const positions = await getUserPerpPositions(sub.address, [marketId]);
		const pos = positions.find(
			(p) => p.marketId === marketId && p.baseAssetAmount > 0n,
		);
		if (pos) {
			foundPosition = pos;
			accountName = sub.name;
			break;
		}
	}

	spin.stop("");

	if (!foundPosition) {
		console.log(infoMsg(`No open position for ${market.value}`));
		return;
	}

	const currentPrice = oracle?.price || foundPosition.entryPrice;
	const priceDiff = currentPrice - foundPosition.entryPrice;
	const unrealizedPnl = foundPosition.isLong
		? (foundPosition.baseAssetAmount * priceDiff) /
			10n ** BigInt(PRICE_DECIMALS)
		: (foundPosition.baseAssetAmount * -priceDiff) /
			10n ** BigInt(PRICE_DECIMALS);

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					market: market.value,
					account: accountName,
					...foundPosition,
					currentPrice: currentPrice.toString(),
					unrealizedPnl: unrealizedPnl.toString(),
				},
				null,
				2,
			),
		);
		return;
	}

	console.log(bold(`\n📊 Position: ${market.value}\n`));

	console.log(
		keyValue(
			{
				Account: accountName,
				Side: formatSide(foundPosition.isLong ? "long" : "short"),
				Size: `${formatAmount(foundPosition.baseAssetAmount, 18, 4)} ${baseSymbol}`,
				Leverage: formatLeverage(foundPosition.leverage),
				"Entry Price": `$${formatAmount(foundPosition.entryPrice, PRICE_DECIMALS, 2)}`,
				"Current Price": `$${formatAmount(currentPrice, PRICE_DECIMALS, 2)}`,
				"Unrealized P&L": formatPnL(unrealizedPnl, USDC_DECIMALS),
				"Realized P&L": formatPnL(foundPosition.realizedPnl, USDC_DECIMALS),
				"Liquidation Price": `$${formatAmount(foundPosition.liquidatePrice, PRICE_DECIMALS, 2)}`,
				"Take Profit":
					foundPosition.takeProfit > 0n
						? `$${formatAmount(foundPosition.takeProfit, PRICE_DECIMALS, 2)}`
						: dim("Not set"),
				"Stop Loss":
					foundPosition.stopLoss > 0n
						? `$${formatAmount(foundPosition.stopLoss, PRICE_DECIMALS, 2)}`
						: dim("Not set"),
			},
			2,
		),
	);
	console.log();
}

/**
 * Close a position
 */
export async function close(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const marketArg = requireArg(args.positional, 0, "market");
	const sizeStr = getFlag<string | number>(args.raw, "size");
	const accountName = getFlag<string>(args.raw, "account");

	const market = findMarket(marketArg);
	if (!market || !market.isPerp) {
		throw new Error(`Perpetual market not found: ${marketArg}`);
	}

	// Unlock wallet
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

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
		throw new Error("No subaccount found");
	}

	// Get current position
	const marketId = Number.parseInt(market.pairId, 10);
	const positions = await getUserPerpPositions(subaccount.address, [marketId]);
	const position = positions.find(
		(p) => p.marketId === marketId && p.baseAssetAmount > 0n,
	);

	if (!position) {
		throw new Error(`No open position for ${market.value}`);
	}

	// Display close preview
	console.log();
	console.log(bold(`📊 Close Position: ${market.value}`));
	console.log();
	console.log(
		keyValue(
			{
				Side: formatSide(position.isLong ? "long" : "short"),
				"Current Size": formatAmount(position.baseAssetAmount, 18, 4),
				"Close Size": sizeStr || "Full position",
			},
			2,
		),
	);

	// Confirm
	if (!args.flags.yes && !args.flags.dryRun) {
		console.log();
		const confirmed = await confirm("Close this position?", true);
		if (!confirmed) {
			console.log(infoMsg("Cancelled."));
			return;
		}
	}

	if (args.flags.dryRun) {
		console.log();
		console.log(infoMsg("[Dry Run] Would close position"));
		return;
	}

	// Get oracle price for closing
	const oraclePrices = await getOraclePrices();
	const baseSymbol = market.tokens[0]?.symbol || "";
	const oracle = oraclePrices.find(
		(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
	);
	const price = oracle?.price || 0n;

	const spin = spinner("Closing position...");
	spin.start();

	try {
		const txHash = await closePosition(
			subaccount.address,
			marketId,
			price,
			BigInt(DEFAULT_SLIPPAGE_BPS),
		);

		spin.stop(success("Position closed!"));
		console.log(dim(`  Transaction: ${truncateAddress(txHash)}`));
	} catch (err) {
		spin.stop(error("Failed to close position"));
		throw err;
	}

	console.log();
}

/**
 * Modify TP/SL
 */
export async function modify(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const marketArg = requireArg(args.positional, 0, "market");
	const tpStr = getFlag<string | number>(args.raw, "tp");
	const slStr = getFlag<string | number>(args.raw, "sl");
	const accountName = getFlag<string>(args.raw, "account");

	if (!tpStr && !slStr) {
		throw new Error("Specify at least one of --tp or --sl");
	}

	const market = findMarket(marketArg);
	if (!market || !market.isPerp) {
		throw new Error(`Perpetual market not found: ${marketArg}`);
	}

	// Unlock wallet
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	const address = getStoredAddress()!;
	const subaccounts = await getUserSubaccounts(address);

	let subaccount = subaccounts[0];
	if (accountName) {
		subaccount = subaccounts.find(
			(s) => s.name.toLowerCase() === accountName.toLowerCase(),
		);
	}

	if (!subaccount) {
		throw new Error("No subaccount found");
	}

	const marketId = Number.parseInt(market.pairId, 10);

	// Get current position to show current TP/SL
	const positions = await getUserPerpPositions(subaccount.address, [marketId]);
	const position = positions.find(
		(p) => p.marketId === marketId && p.baseAssetAmount > 0n,
	);

	if (!position) {
		throw new Error(`No open position for ${market.value}`);
	}

	const takeProfit = tpStr
		? parseUnits(String(tpStr), PRICE_DECIMALS)
		: position.takeProfit;
	const stopLoss = slStr
		? parseUnits(String(slStr), PRICE_DECIMALS)
		: position.stopLoss;

	console.log();
	console.log(bold(`📊 Modify Position: ${market.value}`));
	console.log();
	console.log(
		keyValue(
			{
				"Take Profit": tpStr
					? `$${tpStr}`
					: position.takeProfit > 0n
						? `$${formatAmount(position.takeProfit, PRICE_DECIMALS, 2)} (unchanged)`
						: dim("Not set"),
				"Stop Loss": slStr
					? `$${slStr}`
					: position.stopLoss > 0n
						? `$${formatAmount(position.stopLoss, PRICE_DECIMALS, 2)} (unchanged)`
						: dim("Not set"),
			},
			2,
		),
	);

	if (args.flags.dryRun) {
		console.log();
		console.log(infoMsg("[Dry Run] Would modify TP/SL"));
		return;
	}

	const spin = spinner("Modifying position...");
	spin.start();

	try {
		const txHash = await modifyTpSl(
			subaccount.address,
			marketId,
			takeProfit,
			stopLoss,
		);

		spin.stop(success("Position modified!"));
		console.log(dim(`  Transaction: ${truncateAddress(txHash)}`));
	} catch (err) {
		spin.stop(error("Failed to modify position"));
		throw err;
	}

	console.log();
}
