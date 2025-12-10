/**
 * Position commands - Position management
 */

import { consola } from "consola";
import { parseUnits } from "viem";
import { network } from "../../abis/config.ts";
import { loadConfig } from "../../config/index.ts";
import {
	closePosition,
	findMarket,
	getOraclePrices,
	getPositions,
	getPublicClient,
	getUserSubaccounts,
	modifyTpSl,
	placePerpOrder,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { PRICE_DECIMALS, USDC_DECIMALS } from "../../utils/constants.ts";
import {
	dim,
	formatAmount,
	formatLeverage,
	formatPnL,
	formatSide,
} from "../../utils/format.ts";
import { confirm, keyValue, promptPassword, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * List all open positions
 */
export async function list(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const address = getStoredAddress()!;

	consola.start("Fetching positions...");

	let positions: Awaited<ReturnType<typeof getPositions>> = [];
	try {
		positions = await getPositions(address);
	} catch {
		// May not have positions
	}

	if (args.flags.json) {
		console.log(JSON.stringify(positions, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📊 Open Positions",
		message: "Your perpetual positions",
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (positions.length === 0) {
		consola.info("No open positions.");
		console.log(
			dim("  Open a position with: deepdex perp long ETH-USDC 1 --lev 5"),
		);
	} else {
		const tableData = positions.map((pos) => ({
			Market: pos.market,
			Side: formatSide(pos.isLong ? "long" : "short"),
			Size: formatAmount(pos.size, 18, 4),
			Entry: `$${formatAmount(pos.entryPrice, PRICE_DECIMALS, 2)}`,
			PnL: formatPnL(pos.unrealizedPnl, USDC_DECIMALS),
			Lev: formatLeverage(pos.leverage),
		}));

		console.log(
			table(
				[
					{ header: "Market", key: "Market" },
					{ header: "Side", key: "Side" },
					{ header: "Size", key: "Size", align: "right" },
					{ header: "Entry", key: "Entry", align: "right" },
					{ header: "PnL", key: "PnL", align: "right" },
					{ header: "Lev", key: "Lev", align: "right" },
				],
				tableData,
			),
		);
	}

	console.log();
}

/**
 * Display position details
 */
export async function info(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const pair = requireArg(args.positional, 0, "market");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (!market.isPerp) {
		throw new Error("Positions are only available for perpetual markets");
	}

	const address = getStoredAddress()!;

	consola.start("Fetching position...");

	// Get position for this market
	const positions = await getPositions(address);
	const position = positions.find(
		(p) => p.market.toUpperCase() === market.value.toUpperCase(),
	);

	if (args.flags.json) {
		console.log(JSON.stringify(position || null, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: `📊 Position: ${market.value}`,
		message: position ? "Position details" : "No position found",
		style: {
			padding: 1,
			borderColor: position ? "blue" : "gray",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (!position) {
		consola.info("No open position for this market.");
		console.log(dim(`  Open one with: deepdex perp long ${pair} 1 --lev 5`));
	} else {
		console.log(
			keyValue(
				{
					Side: formatSide(position.isLong ? "long" : "short"),
					Size: formatAmount(position.size, 18, 4),
					"Entry Price": `$${formatAmount(position.entryPrice, PRICE_DECIMALS, 2)}`,
					"Mark Price": `$${formatAmount(position.markPrice, PRICE_DECIMALS, 2)}`,
					"Realized PnL": formatPnL(position.unrealizedPnl, USDC_DECIMALS),
					Leverage: formatLeverage(position.leverage),
					"Take Profit": position.takeProfit
						? `$${formatAmount(position.takeProfit, PRICE_DECIMALS, 2)}`
						: dim("Not set"),
					"Stop Loss": position.stopLoss
						? `$${formatAmount(position.stopLoss, PRICE_DECIMALS, 2)}`
						: dim("Not set"),
				},
				2,
			),
		);
	}

	console.log();
}

/**
 * Close a position
 */
export async function close(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const pair = requireArg(args.positional, 0, "market");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (!market.tokens[0]) {
		throw new Error("Invalid market configuration: missing base token");
	}

	const size = getFlag<string>(args.raw, "size");

	console.log();
	consola.box({
		title: "🔒 Close Position",
		message: `Market: ${market.value}
Size: ${size || "Full position"}`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Close this position?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Closing position...");

	try {
		const address = getStoredAddress()!;
		const subaccounts = await getUserSubaccounts(address);
		const subaccount = subaccounts[0];
		if (!subaccount) throw new Error("No subaccount found.");

		const marketId = Number.parseInt(market.pairId, 10);
		let hash: `0x${string}`;

		// Get oracle price for market orders
		const baseToken = market.tokens[0];
		if (!baseToken)
			throw new Error("Invalid market configuration: missing base token");
		const oraclePrices = await getOraclePrices();
		const priceObj = oraclePrices.find((p) => p.symbol === baseToken.symbol);
		if (!priceObj) throw new Error("Oracle price not available");

		if (size) {
			// Partial close
			const positions = await getPositions(address);
			const position = positions.find(
				(p) => p.market.toUpperCase() === market.value.toUpperCase(),
			);
			if (!position) throw new Error("No open position to close.");

			const isLong = !position.isLong; // Opposite side
			const sizeBigInt = parseUnits(size, market.tokens[0].decimals);

			hash = await placePerpOrder({
				subaccount: subaccount.address,
				marketId,
				isLong,
				size: sizeBigInt,
				price: priceObj.price, // Oracle price for market orders
				orderType: 0, // Market
				leverage: position.leverage,
				takeProfit: 0n,
				stopLoss: 0n,
				reduceOnly: true,
				postOnly: 0,
			});
		} else {
			// Full close
			const userConfig = loadConfig();
			const slippageBps = BigInt(
				Math.round((userConfig.trading.max_slippage || 0.5) * 100),
			);
			hash = await closePosition(
				subaccount.address,
				marketId,
				priceObj.price,
				slippageBps,
			);
		}

		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		console.log();
		consola.success(`Position closed: ${market.value}`);
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log();
	} catch (error) {
		consola.error(`Failed to close position: ${(error as Error).message}`);
	}
}

/**
 * Modify position TP/SL
 */
export async function modify(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const pair = requireArg(args.positional, 0, "market");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	const tp = getFlag<string>(args.raw, "tp");
	const sl = getFlag<string>(args.raw, "sl");

	if (!tp && !sl) {
		throw new Error("Specify at least one of --tp or --sl");
	}

	console.log();
	consola.box({
		title: "✏️ Modify Position",
		message: `Market: ${market.value}
${tp ? `Take Profit: $${tp}` : ""}
${sl ? `Stop Loss: $${sl}` : ""}`,
		style: {
			padding: 1,
			borderColor: "yellow",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Apply these changes?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Updating position...");

	try {
		const address = getStoredAddress()!;
		const subaccounts = await getUserSubaccounts(address);
		const subaccount = subaccounts[0];
		if (!subaccount) throw new Error("No subaccount found.");

		const marketId = Number.parseInt(market.pairId, 10);

		const tpBigInt = tp ? parseUnits(tp, PRICE_DECIMALS) : 0n;
		const slBigInt = sl ? parseUnits(sl, PRICE_DECIMALS) : 0n;

		const hash = await modifyTpSl(
			subaccount.address,
			marketId,
			tpBigInt,
			slBigInt,
		);
		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		console.log();
		consola.success(`Position updated: ${market.value}`);
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log();
	} catch (error) {
		consola.error(`Failed to update position: ${(error as Error).message}`);
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
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}
}
