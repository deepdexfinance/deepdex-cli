/**
 * History command - Transaction and trade history
 */

import { consola } from "consola";
import { walletExists } from "../../services/wallet.ts";
import { dim, formatSide } from "../../utils/format.ts";
import { table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, optionalArg } from "../parser.ts";

// ============================================================================
// Sample Data (would come from indexer in production)
// ============================================================================

const SAMPLE_TRADES = [
	{
		id: "0x1234567890abcdef",
		market: "ETH-USDC",
		side: "long",
		size: 1.5,
		price: 2050.0,
		pnl: 125.5,
		fee: 3.08,
		timestamp: Date.now() - 86400000,
	},
	{
		id: "0xabcdef1234567890",
		market: "SOL-USDC",
		side: "short",
		size: 50.0,
		price: 25.0,
		pnl: -15.0,
		fee: 1.88,
		timestamp: Date.now() - 172800000,
	},
];

const SAMPLE_TRANSFERS = [
	{
		id: "0x1111222233334444",
		type: "deposit",
		token: "USDC",
		amount: 1000.0,
		account: "main",
		timestamp: Date.now() - 259200000,
	},
	{
		id: "0x5555666677778888",
		type: "withdraw",
		token: "USDC",
		amount: 250.0,
		account: "main",
		timestamp: Date.now() - 345600000,
	},
];

// ============================================================================
// Commands
// ============================================================================

/**
 * Show history (trades, transfers, or all)
 */
export async function run(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const historyType = optionalArg(args.positional, 0, "all");
	const limit = getFlag<number>(args.raw, "limit") || 20;
	const marketFilter = getFlag<string>(args.raw, "market");

	switch (historyType) {
		case "trades":
			await showTradeHistory(args, limit, marketFilter);
			break;
		case "transfers":
			await showTransferHistory(args, limit);
			break;
		default:
			await showAllHistory(args, limit, marketFilter);
	}
}

/**
 * Show trade history
 */
async function showTradeHistory(
	args: ParsedArgs,
	limit: number,
	marketFilter?: string,
): Promise<void> {
	consola.start("Fetching trade history...");

	let trades = [...SAMPLE_TRADES];
	if (marketFilter) {
		trades = trades.filter(
			(t) => t.market.toUpperCase() === marketFilter.toUpperCase(),
		);
	}

	if (args.flags.json) {
		console.log(JSON.stringify(trades.slice(0, limit), null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📜 Trade History",
		message: `Last ${limit} trades${marketFilter ? ` for ${marketFilter}` : ""}`,
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (trades.length === 0) {
		consola.info("No trade history found.");
		console.log(
			dim("  Start trading with: deepdex perp long ETH-USDC 1 --lev 5"),
		);
	} else {
		const tableData = trades.slice(0, limit).map((trade) => ({
			Date: new Date(trade.timestamp).toLocaleDateString(),
			Market: trade.market,
			Side: formatSide(trade.side as "long" | "short"),
			Size: trade.size.toFixed(2),
			Price: `$${trade.price.toFixed(2)}`,
			PnL:
				trade.pnl >= 0
					? `\x1b[32m+$${trade.pnl.toFixed(2)}\x1b[0m`
					: `\x1b[31m-$${Math.abs(trade.pnl).toFixed(2)}\x1b[0m`,
		}));

		console.log(
			table(
				[
					{ header: "Date", key: "Date" },
					{ header: "Market", key: "Market" },
					{ header: "Side", key: "Side" },
					{ header: "Size", key: "Size", align: "right" },
					{ header: "Price", key: "Price", align: "right" },
					{ header: "PnL", key: "PnL", align: "right" },
				],
				tableData,
			),
		);
	}

	console.log();
}

/**
 * Show transfer history
 */
async function showTransferHistory(
	args: ParsedArgs,
	limit: number,
): Promise<void> {
	consola.start("Fetching transfer history...");

	const transfers = [...SAMPLE_TRANSFERS];

	if (args.flags.json) {
		console.log(JSON.stringify(transfers.slice(0, limit), null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "💸 Transfer History",
		message: `Last ${limit} transfers`,
		style: {
			padding: 1,
			borderColor: "yellow",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (transfers.length === 0) {
		consola.info("No transfer history found.");
		console.log(dim("  Make a deposit: deepdex account deposit 1000 USDC"));
	} else {
		const tableData = transfers.slice(0, limit).map((transfer) => ({
			Date: new Date(transfer.timestamp).toLocaleDateString(),
			Type: transfer.type === "deposit" ? "⬇ Deposit" : "⬆ Withdraw",
			Token: transfer.token,
			Amount: transfer.amount.toFixed(2),
			Account: transfer.account,
		}));

		console.log(
			table(
				[
					{ header: "Date", key: "Date" },
					{ header: "Type", key: "Type" },
					{ header: "Token", key: "Token" },
					{ header: "Amount", key: "Amount", align: "right" },
					{ header: "Account", key: "Account" },
				],
				tableData,
			),
		);
	}

	console.log();
}

/**
 * Show all history (trades + transfers)
 */
async function showAllHistory(
	args: ParsedArgs,
	limit: number,
	_marketFilter?: string,
): Promise<void> {
	consola.start("Fetching history...");

	// Combine and sort by timestamp
	const allEvents = [
		...SAMPLE_TRADES.map((t) => ({ ...t, eventType: "trade" as const })),
		...SAMPLE_TRANSFERS.map((t) => ({ ...t, eventType: "transfer" as const })),
	].sort((a, b) => b.timestamp - a.timestamp);

	if (args.flags.json) {
		console.log(JSON.stringify(allEvents.slice(0, limit), null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📋 Activity History",
		message: `Last ${limit} events`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (allEvents.length === 0) {
		consola.info("No history found.");
	} else {
		const tableData = allEvents.slice(0, limit).map((event) => {
			if (event.eventType === "trade") {
				return {
					Date: new Date(event.timestamp).toLocaleDateString(),
					Type: "Trade",
					Details: `${(event as (typeof SAMPLE_TRADES)[0]).side.toUpperCase()} ${(event as (typeof SAMPLE_TRADES)[0]).market}`,
					Amount: `${(event as (typeof SAMPLE_TRADES)[0]).size.toFixed(2)} @ $${(event as (typeof SAMPLE_TRADES)[0]).price.toFixed(2)}`,
				};
			}
			return {
				Date: new Date(event.timestamp).toLocaleDateString(),
				Type:
					(event as (typeof SAMPLE_TRANSFERS)[0]).type === "deposit"
						? "Deposit"
						: "Withdraw",
				Details: `${(event as (typeof SAMPLE_TRANSFERS)[0]).token} → ${(event as (typeof SAMPLE_TRANSFERS)[0]).account}`,
				Amount: `${(event as (typeof SAMPLE_TRANSFERS)[0]).amount.toFixed(2)} ${(event as (typeof SAMPLE_TRANSFERS)[0]).token}`,
			};
		});

		console.log(
			table(
				[
					{ header: "Date", key: "Date" },
					{ header: "Type", key: "Type" },
					{ header: "Details", key: "Details" },
					{ header: "Amount", key: "Amount", align: "right" },
				],
				tableData,
			),
		);
	}

	console.log();
}
