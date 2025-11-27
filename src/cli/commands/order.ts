/**
 * Order commands - Order management
 */

import { consola } from "consola";
import { getOpenOrders } from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { PRICE_DECIMALS } from "../../utils/constants.ts";
import {
	dim,
	formatAmount,
	formatSide,
	truncateAddress,
} from "../../utils/format.ts";
import { confirm, promptPassword, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * List open orders
 */
export async function list(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const address = getStoredAddress()!;
	const marketFilter = getFlag<string>(args.raw, "market");

	consola.start("Fetching orders...");

	let orders: Awaited<ReturnType<typeof getOpenOrders>> = [];
	try {
		orders = await getOpenOrders(address);
	} catch {
		// May not have orders
	}

	// Filter by market if specified
	if (marketFilter) {
		orders = orders.filter(
			(o) => o.market.toUpperCase() === marketFilter.toUpperCase(),
		);
	}

	if (args.flags.json) {
		console.log(JSON.stringify(orders, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📋 Open Orders",
		message: marketFilter ? `Filtered by: ${marketFilter}` : "All markets",
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (orders.length === 0) {
		consola.info("No open orders.");
		console.log(
			dim("  Place an order with: deepdex spot buy ETH/USDC 0.1 --price 2000"),
		);
	} else {
		const tableData = orders.map((order) => ({
			ID: truncateAddress(order.id as `0x${string}`, 6),
			Market: order.market,
			Side: formatSide(order.side),
			Type: order.type.toUpperCase(),
			Price: order.price
				? `$${formatAmount(order.price, PRICE_DECIMALS, 2)}`
				: "MARKET",
			Size: formatAmount(order.size, 18, 4),
			Filled: `${((Number(order.filled) / Number(order.size)) * 100).toFixed(0)}%`,
		}));

		console.log(
			table(
				[
					{ header: "ID", key: "ID" },
					{ header: "Market", key: "Market" },
					{ header: "Side", key: "Side" },
					{ header: "Type", key: "Type" },
					{ header: "Price", key: "Price", align: "right" },
					{ header: "Size", key: "Size", align: "right" },
					{ header: "Filled", key: "Filled", align: "right" },
				],
				tableData,
			),
		);
	}

	console.log();
}

/**
 * Cancel a specific order
 */
export async function cancel(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const orderId = requireArg(args.positional, 0, "order_id");

	console.log();
	consola.box({
		title: "❌ Cancel Order",
		message: `Order ID: ${truncateAddress(orderId as `0x${string}`, 8)}`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Cancel this order?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Cancelling order...");

	// Simulate transaction
	await new Promise((resolve) => setTimeout(resolve, 1000));

	console.log();
	consola.success("Order cancelled");
	console.log();
}

/**
 * Cancel all open orders
 */
export async function cancelAll(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const marketFilter = getFlag<string>(args.raw, "market");
	const address = getStoredAddress()!;

	// Get orders count
	let orders = await getOpenOrders(address);
	if (marketFilter) {
		orders = orders.filter(
			(o) => o.market.toUpperCase() === marketFilter.toUpperCase(),
		);
	}

	if (orders.length === 0) {
		consola.info("No orders to cancel.");
		return;
	}

	console.log();
	consola.box({
		title: "❌ Cancel All Orders",
		message: `${orders.length} order(s) will be cancelled
${marketFilter ? `Market: ${marketFilter}` : "All markets"}`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		consola.warn("This action cannot be undone.");
		const confirmed = await confirm(`Cancel ${orders.length} order(s)?`, false);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Cancelling orders...");

	// Simulate transaction
	await new Promise((resolve) => setTimeout(resolve, 1500));

	console.log();
	consola.success(`${orders.length} order(s) cancelled`);
	console.log();
}

/**
 * View order history
 */
export async function history(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const marketFilter = getFlag<string>(args.raw, "market");
	const limit = getFlag<number>(args.raw, "limit") || 20;

	consola.start("Fetching order history...");

	// Simulated order history
	const orders = [
		{
			id: "0x1234...5678",
			market: "ETH-USDC",
			side: "buy",
			type: "limit",
			price: 2000n * 10n ** 8n,
			size: 10n ** 18n,
			status: "filled",
			timestamp: Date.now() - 3600000,
		},
		{
			id: "0x2345...6789",
			market: "SOL-USDC",
			side: "sell",
			type: "market",
			price: null,
			size: 50n * 10n ** 18n,
			status: "filled",
			timestamp: Date.now() - 7200000,
		},
	];

	if (args.flags.json) {
		console.log(JSON.stringify(orders, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📜 Order History",
		message: `Last ${limit} orders${marketFilter ? ` for ${marketFilter}` : ""}`,
		style: {
			padding: 1,
			borderColor: "gray",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (orders.length === 0) {
		consola.info("No order history found.");
	} else {
		const tableData = orders.map((order) => ({
			Time: new Date(order.timestamp).toLocaleString(),
			Market: order.market,
			Side: formatSide(order.side as "buy" | "sell"),
			Type: order.type.toUpperCase(),
			Price: order.price
				? `$${formatAmount(order.price, PRICE_DECIMALS, 2)}`
				: "-",
			Status: order.status === "filled" ? "✓ Filled" : order.status,
		}));

		console.log(
			table(
				[
					{ header: "Time", key: "Time" },
					{ header: "Market", key: "Market" },
					{ header: "Side", key: "Side" },
					{ header: "Type", key: "Type" },
					{ header: "Price", key: "Price", align: "right" },
					{ header: "Status", key: "Status" },
				],
				tableData,
			),
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
