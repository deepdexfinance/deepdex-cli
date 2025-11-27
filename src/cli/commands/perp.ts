/**
 * Perpetual trading commands
 */

import { consola } from "consola";
import { findMarket } from "../../services/client.ts";
import {
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { MAX_LEVERAGE } from "../../utils/constants.ts";
import { dim, formatLeverage, formatSide } from "../../utils/format.ts";
import { confirm, promptPassword } from "../../utils/ui.ts";
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
	const amount = requireArg(args.positional, 1, "amount");
	const leverage =
		getFlag<number>(args.raw, "lev") ||
		getFlag<number>(args.raw, "leverage") ||
		1;
	const price = getFlag<string>(args.raw, "price");
	const tp = getFlag<string>(args.raw, "tp");
	const sl = getFlag<string>(args.raw, "sl");
	const reduceOnly = getFlag<boolean>(args.raw, "reduce-only") || false;
	const accountName = getFlag<string>(args.raw, "account") || "default";

	// Find market
	const market = findMarket(pair);
	if (!market) {
		throw new Error(`Market not found: ${pair}`);
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

	if (leverage > market.leverage) {
		throw new Error(`Max leverage for ${pair} is ${market.leverage}x`);
	}

	const orderType = price ? "limit" : "market";

	console.log();
	consola.box({
		title: `📊 Perpetual ${side.toUpperCase()}`,
		message: `Market: ${market.value}
Size: ${amount} ${market.tokens[0]?.symbol || ""}
Leverage: ${formatLeverage(leverage)}
Type: ${orderType.toUpperCase()}
${price ? `Price: $${price}` : ""}
${tp ? `Take Profit: $${tp}` : ""}
${sl ? `Stop Loss: $${sl}` : ""}
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
		consola.warn(`High leverage (${leverage}x) increases liquidation risk!`);
	}

	// Confirm if not dry-run or --yes
	if (!args.flags.dryRun && !args.flags.yes) {
		console.log();
		const confirmed = await confirm(`Open ${formatSide(side)} position?`, true);
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

	// Simulate order execution
	await new Promise((resolve) => setTimeout(resolve, 1500));

	const positionId = `0x${Math.random().toString(16).slice(2, 10)}...`;

	console.log();
	consola.success(`${side.toUpperCase()} position opened!`);
	console.log();
	console.log(dim("  Position ID: ") + positionId);
	console.log(`${dim("  Size:        ")}${amount} ${market.tokens[0]?.symbol}`);
	console.log(dim("  Leverage:    ") + formatLeverage(leverage));
	console.log(
		dim("  Status:      ") + (orderType === "market" ? "Active" : "Pending"),
	);
	console.log();
	console.log(dim("  View: deepdex position list"));
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
