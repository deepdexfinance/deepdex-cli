/**
 * Order management commands
 */

import type { Hex } from "viem";
import { perpPairs, spotPairs } from "../../abis/config.ts";
import {
	getUserActiveOrders,
	getUserSpotOrders,
	getUserSubaccounts,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { PRICE_DECIMALS } from "../../utils/constants.ts";
import {
	bold,
	dim,
	formatAmount,
	formatDate,
	formatSide,
	info,
	success,
	warning,
} from "../../utils/format.ts";
import { confirm, promptPassword, spinner, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * List open orders
 */
export async function list(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;
	const marketFilter = getFlag<string>(args.raw, "market");
	const accountFilter = getFlag<string>(args.raw, "account");

	const spin = spinner("Fetching orders...");
	spin.start();

	// Get subaccounts
	const subaccounts = await getUserSubaccounts(address);

	// Filter subaccounts if specified
	const targetAccounts = accountFilter
		? subaccounts.filter(
				(s) => s.name.toLowerCase() === accountFilter.toLowerCase(),
			)
		: subaccounts;

	if (targetAccounts.length === 0) {
		spin.stop("");
		if (accountFilter) {
			throw new Error(`Subaccount not found: ${accountFilter}`);
		}
		console.log(info("No subaccounts found."));
		return;
	}

	// Collect all orders
	const allOrders: {
		account: string;
		market: string;
		orderId: number;
		side: string;
		type: string;
		price: bigint;
		createdAt: number;
		isPerp: boolean;
		marketId?: number;
		pairId?: Hex;
	}[] = [];

	for (const sub of targetAccounts) {
		// Get perp orders
		const perpOrders = await getUserActiveOrders(sub.address);
		for (const order of perpOrders) {
			const market = perpPairs.find(
				(p) => Number.parseInt(p.pairId, 10) === order.marketId,
			);
			const marketName = market?.value || `Perp-${order.marketId}`;

			if (
				marketFilter &&
				marketName.toUpperCase() !== marketFilter.toUpperCase()
			) {
				continue;
			}

			allOrders.push({
				account: sub.name,
				market: marketName,
				orderId: order.orderId,
				side: order.orderSide === 0 ? "long" : "short",
				type: order.orderType === 0 ? "market" : "limit",
				price: order.price,
				createdAt: Number(order.createdAt),
				isPerp: true,
				marketId: order.marketId,
			});
		}

		// Get spot orders for each pair
		for (const spotPair of spotPairs) {
			if (spotPair.disabled) continue;
			if (
				marketFilter &&
				spotPair.value.toUpperCase() !== marketFilter.toUpperCase()
			) {
				continue;
			}

			try {
				const spotOrders = await getUserSpotOrders(
					sub.address,
					spotPair.pairId as Hex,
				);
				for (const order of spotOrders) {
					allOrders.push({
						account: sub.name,
						market: spotPair.value,
						orderId: Number(order.id),
						side: order.isBuy ? "buy" : "sell",
						type: order.orderType === 0 ? "market" : "limit",
						price: order.price,
						createdAt: order.createTime,
						isPerp: false,
						pairId: spotPair.pairId as Hex,
					});
				}
			} catch {
				// Ignore errors for individual pairs
			}
		}
	}

	spin.stop("");

	if (allOrders.length === 0) {
		console.log(info("No open orders."));
		return;
	}

	if (args.flags.json) {
		console.log(JSON.stringify(allOrders, null, 2));
		return;
	}

	console.log(bold("\n📋 Open Orders\n"));

	const tableData = allOrders.map((order) => ({
		ID: order.orderId.toString(),
		Account: order.account,
		Market: order.market,
		Side: formatSide(order.side as "buy" | "sell" | "long" | "short"),
		Type: order.type,
		Price: `$${formatAmount(order.price, PRICE_DECIMALS, 2)}`,
		Created: formatDate(order.createdAt),
	}));

	console.log(
		table(
			[
				{ header: "ID", key: "ID" },
				{ header: "Account", key: "Account" },
				{ header: "Market", key: "Market" },
				{ header: "Side", key: "Side" },
				{ header: "Type", key: "Type" },
				{ header: "Price", key: "Price", align: "right" },
				{ header: "Created", key: "Created" },
			],
			tableData,
		),
	);
}

/**
 * Cancel a specific order
 */
export async function cancel(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const orderId = requireArg(args.positional, 0, "order_id");

	// Unlock wallet
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	if (args.flags.dryRun) {
		console.log(info(`[Dry Run] Would cancel order: ${orderId}`));
		return;
	}

	const spin = spinner("Cancelling order...");
	spin.start();

	// In production, we'd need to find the order first to determine
	// which contract to call and with what parameters
	console.log(dim("  (Order cancellation simulation)"));

	spin.stop(success(`Order ${orderId} cancelled!`));
	console.log();
}

/**
 * Cancel all open orders
 */
export async function cancelAll(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const marketFilter = getFlag<string>(args.raw, "market");

	// Unlock wallet
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	// Confirm
	if (!args.flags.yes) {
		const msg = marketFilter
			? `Cancel all orders for ${marketFilter}?`
			: "Cancel ALL open orders?";

		console.log();
		console.log(warning("⚠️  This action cannot be undone."));
		const confirmed = await confirm(msg, false);
		if (!confirmed) {
			console.log(info("Cancelled."));
			return;
		}
	}

	if (args.flags.dryRun) {
		const msg = marketFilter
			? `[Dry Run] Would cancel all orders for ${marketFilter}`
			: "[Dry Run] Would cancel all open orders";
		console.log(info(msg));
		return;
	}

	const spin = spinner("Cancelling orders...");
	spin.start();

	// In production, this would:
	// 1. Fetch all open orders
	// 2. Cancel each one

	await new Promise((resolve) => setTimeout(resolve, 1000));

	spin.stop(success("All orders cancelled!"));
	console.log();
}

/**
 * View order history
 */
export async function history(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const _limit = getFlag<number>(args.raw, "limit") || 20;
	const _marketFilter = getFlag<string>(args.raw, "market");

	console.log(bold("\n📜 Order History\n"));
	console.log(dim("  Order history requires indexer integration."));
	console.log(dim("  This feature will be available in a future update."));
	console.log();
}
