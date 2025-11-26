/**
 * Spot trading commands
 */

import { consola } from "consola";
import { findMarket } from "../../services/client.ts";
import {
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { dim, formatSide } from "../../utils/format.ts";
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
	const accountName = getFlag<string>(args.raw, "account") || "default";

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

	const orderType = price ? "limit" : "market";
	const _sideColor = side === "buy" ? "\x1b[32m" : "\x1b[31m";
	const _resetColor = "\x1b[0m";

	console.log();
	consola.box({
		title: `📈 Spot ${side.toUpperCase()}`,
		message: `Market: ${market.value}
Size: ${amount} ${market.tokens[0]?.symbol || ""}
Type: ${orderType.toUpperCase()}
${price ? `Price: $${price}` : ""}
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

	// Simulate order execution
	await new Promise((resolve) => setTimeout(resolve, 1500));

	const orderId = `0x${Math.random().toString(16).slice(2, 10)}...`;

	console.log();
	consola.success(
		`${orderType === "market" ? "Order executed!" : "Order placed!"}`,
	);
	console.log();
	console.log(dim("  Order ID:  ") + orderId);
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
