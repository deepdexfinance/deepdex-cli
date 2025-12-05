/**
 * Command router for DeepDex CLI
 */

import { consola } from "consola";
// Import command modules
import * as account from "./commands/account.ts";
import * as balance from "./commands/balance.ts";
import * as bot from "./commands/bot.ts";
import * as config from "./commands/config.ts";
import * as faucet from "./commands/faucet.ts";
import * as health from "./commands/health.ts";
import * as history from "./commands/history.ts";
import * as init from "./commands/init.ts";
import * as market from "./commands/market.ts";
import * as order from "./commands/order.ts";
import * as perp from "./commands/perp.ts";
import * as position from "./commands/position.ts";
import * as spot from "./commands/spot.ts";
import * as wallet from "./commands/wallet.ts";
import { shouldShowHelp, showCommandHelp, showMainHelp } from "./help.ts";
import type { ParsedArgs } from "./parser.ts";

// ============================================================================
// Command Aliases
// ============================================================================

const ALIASES: Record<string, string[]> = {
	buy: ["spot", "buy"],
	sell: ["spot", "sell"],
	long: ["perp", "long"],
	short: ["perp", "short"],
	portfolio: ["balance", "portfolio"],
};

// ============================================================================
// Router
// ============================================================================

/**
 * Route parsed arguments to the appropriate command handler
 */
export async function route(args: ParsedArgs): Promise<void> {
	// Expand aliases
	const command = expandAlias(args.command);

	// Handle empty command
	if (command.length === 0 || (command.length === 1 && command[0] === "")) {
		showMainHelp();
		return;
	}

	// Handle help command
	if (command[0] === "help") {
		if (command.length > 1) {
			showCommandHelp(command.slice(1));
		} else {
			showMainHelp();
		}
		return;
	}

	// Handle --help flag on any command
	if (shouldShowHelp(args.raw)) {
		showCommandHelp(command);
		return;
	}

	// Route to command handler
	const [primary, secondary] = command;

	switch (primary) {
		// Setup
		case "init":
			await init.run(args);
			break;
		case "quickstart":
			await init.quickstart(args);
			break;

		// Wallet
		case "wallet":
			await routeWallet(secondary, args);
			break;

		// Account
		case "account":
			await routeAccount(secondary, args);
			break;

		// Faucet
		case "faucet":
			await faucet.run(args);
			break;

		// Balance & Portfolio
		case "balance":
			if (secondary === "portfolio") {
				await balance.portfolio(args);
			} else {
				await balance.run(args);
			}
			break;
		case "portfolio":
			await balance.portfolio(args);
			break;

		// Market
		case "market":
			await routeMarket(secondary, args);
			break;

		// Trading
		case "spot":
			await routeSpot(secondary, args);
			break;
		case "perp":
			await routePerp(secondary, args);
			break;

		// Orders & Positions
		case "order":
			await routeOrder(secondary, args);
			break;
		case "position":
			await routePosition(secondary, args);
			break;

		// Bot
		case "bot":
			await routeBot(secondary, args);
			break;

		// Config
		case "config":
			await routeConfig(secondary, args);
			break;

		// History
		case "history":
			await history.run(args);
			break;

		// Health
		case "health":
			await health.run(args);
			break;

		default:
			consola.error(`Unknown command: ${primary}`);
			consola.info("Run 'deepdex help' for available commands.");
			process.exit(1);
	}
}

// ============================================================================
// Sub-routers
// ============================================================================

async function routeWallet(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "info":
			await wallet.info(args);
			break;
		case "list":
		case undefined:
			await wallet.list(args);
			break;
		case "create":
			await wallet.create(args);
			break;
		case "switch":
			await wallet.switchCmd(args);
			break;
		case "rename":
			await wallet.rename(args);
			break;
		case "delete":
		case "remove":
			await wallet.remove(args);
			break;
		case "export":
			await wallet.exportKey(args);
			break;
		case "import":
			await wallet.importKey(args);
			break;
		case "sign":
			await wallet.sign(args);
			break;
		case "transfer":
		case "send":
			await wallet.transfer(args);
			break;
		default:
			throw new Error(`Unknown wallet command: ${subcommand}`);
	}
}

async function routeAccount(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "create":
			await account.create(args);
			break;
		case "list":
		case undefined:
			await account.list(args);
			break;
		case "info":
			await account.info(args);
			break;
		case "deposit":
			await account.deposit(args);
			break;
		case "withdraw":
			await account.withdraw(args);
			break;
		case "delegate":
			await account.delegate(args);
			break;
		default:
			throw new Error(`Unknown account command: ${subcommand}`);
	}
}

async function routeMarket(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "list":
		case undefined:
			await market.list(args);
			break;
		case "info":
			await market.info(args);
			break;
		case "price":
			await market.price(args);
			break;
		case "orderbook":
			await market.orderbook(args);
			break;
		case "trades":
			await market.trades(args);
			break;
		case "funding":
			await market.funding(args);
			break;
		default:
			throw new Error(`Unknown market command: ${subcommand}`);
	}
}

async function routeSpot(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "buy":
			await spot.buy(args);
			break;
		case "sell":
			await spot.sell(args);
			break;
		default:
			throw new Error(
				`Unknown spot command: ${subcommand}. Use 'buy' or 'sell'.`,
			);
	}
}

async function routePerp(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "long":
			await perp.long(args);
			break;
		case "short":
			await perp.short(args);
			break;
		default:
			throw new Error(
				`Unknown perp command: ${subcommand}. Use 'long' or 'short'.`,
			);
	}
}

async function routeOrder(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "list":
		case undefined:
			await order.list(args);
			break;
		case "cancel":
			await order.cancel(args);
			break;
		case "cancel-all":
			await order.cancelAll(args);
			break;
		case "history":
			await order.history(args);
			break;
		default:
			throw new Error(`Unknown order command: ${subcommand}`);
	}
}

async function routePosition(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "list":
		case undefined:
			await position.list(args);
			break;
		case "info":
			await position.info(args);
			break;
		case "close":
			await position.close(args);
			break;
		case "modify":
			await position.modify(args);
			break;
		default:
			throw new Error(`Unknown position command: ${subcommand}`);
	}
}

async function routeBot(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "start":
			await bot.start(args);
			break;
		case "stop":
			await bot.stop(args);
			break;
		case "status":
		case undefined:
			await bot.status(args);
			break;
		case "logs":
			await bot.logs(args);
			break;
		case "list-strategies":
			await bot.listStrategies(args);
			break;
		default:
			throw new Error(`Unknown bot command: ${subcommand}`);
	}
}

async function routeConfig(subcommand: string | undefined, args: ParsedArgs) {
	switch (subcommand) {
		case "show":
		case undefined:
			await config.show(args);
			break;
		case "set":
			await config.set(args);
			break;
		case "reset":
			await config.reset(args);
			break;
		default:
			throw new Error(`Unknown config command: ${subcommand}`);
	}
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Expand command aliases
 */
function expandAlias(command: string[]): string[] {
	if (command.length === 0) return command;

	const first = command[0];
	if (first && ALIASES[first]) {
		return [...ALIASES[first], ...command.slice(1)];
	}

	return command;
}
