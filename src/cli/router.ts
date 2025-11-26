/**
 * Command router for DeepDex CLI
 */

import { error } from "../utils/format.ts";
import * as accountCmd from "./commands/account.ts";
import * as balanceCmd from "./commands/balance.ts";
import * as botCmd from "./commands/bot.ts";
import * as configCmd from "./commands/config.ts";
import * as faucetCmd from "./commands/faucet.ts";
import * as healthCmd from "./commands/health.ts";
import * as historyCmd from "./commands/history.ts";
// Import command handlers
import * as initCmd from "./commands/init.ts";
import * as marketCmd from "./commands/market.ts";
import * as orderCmd from "./commands/order.ts";
import * as perpCmd from "./commands/perp.ts";
import * as positionCmd from "./commands/position.ts";
import * as spotCmd from "./commands/spot.ts";
import * as walletCmd from "./commands/wallet.ts";
import { shouldShowHelp, showCommandHelp, showMainHelp } from "./help.ts";
import type { ParsedArgs } from "./parser.ts";

// ============================================================================
// Route Definitions
// ============================================================================

type CommandHandler = (args: ParsedArgs) => Promise<void>;

const routes: Record<string, CommandHandler> = {
	// Setup
	init: initCmd.run,
	quickstart: initCmd.quickstart,

	// Wallet
	"wallet info": walletCmd.info,
	"wallet export": walletCmd.exportKey,
	"wallet import": walletCmd.importKey,
	"wallet sign": walletCmd.sign,

	// Account
	"account create": accountCmd.create,
	"account list": accountCmd.list,
	"account info": accountCmd.info,
	"account deposit": accountCmd.deposit,
	"account withdraw": accountCmd.withdraw,
	"account delegate": accountCmd.delegate,

	// Faucet
	faucet: faucetCmd.run,

	// Market
	"market list": marketCmd.list,
	"market info": marketCmd.info,
	"market price": marketCmd.price,
	"market orderbook": marketCmd.orderbook,
	"market trades": marketCmd.trades,
	"market funding": marketCmd.funding,

	// Balance & Portfolio
	balance: balanceCmd.run,
	portfolio: balanceCmd.portfolio,

	// Spot Trading
	"spot buy": spotCmd.buy,
	"spot sell": spotCmd.sell,

	// Perp Trading
	"perp long": perpCmd.long,
	"perp short": perpCmd.short,

	// Order Management
	"order list": orderCmd.list,
	"order cancel": orderCmd.cancel,
	"order cancel-all": orderCmd.cancelAll,
	"order history": orderCmd.history,

	// Position Management
	"position list": positionCmd.list,
	"position info": positionCmd.info,
	"position close": positionCmd.close,
	"position modify": positionCmd.modify,

	// Bot
	"bot start": botCmd.start,
	"bot stop": botCmd.stop,
	"bot status": botCmd.status,
	"bot logs": botCmd.logs,
	"bot list-strategies": botCmd.listStrategies,

	// Config
	"config show": configCmd.show,
	"config set": configCmd.set,
	"config reset": configCmd.reset,

	// Health
	health: healthCmd.run,

	// History
	"history trades": historyCmd.trades,
	"history transfers": historyCmd.transfers,
};

// Aliases
const aliases: Record<string, string> = {
	buy: "spot buy",
	sell: "spot sell",
	long: "perp long",
	short: "perp short",
};

// Parent commands that need subcommands
const parentCommands = new Set([
	"wallet",
	"account",
	"market",
	"spot",
	"perp",
	"order",
	"position",
	"bot",
	"config",
	"history",
]);

// ============================================================================
// Router
// ============================================================================

/**
 * Route command to appropriate handler
 */
export async function route(args: ParsedArgs): Promise<void> {
	const { command, raw } = args;

	// No command - show main help
	if (command.length === 0) {
		showMainHelp();
		return;
	}

	// Help command
	if (command[0] === "help") {
		if (command.length > 1) {
			showCommandHelp(command.slice(1));
		} else {
			showMainHelp();
		}
		return;
	}

	// Check for --help flag
	if (shouldShowHelp(raw)) {
		showCommandHelp(command);
		return;
	}

	// Build command key
	let commandKey = command.join(" ");

	// Check aliases
	if (aliases[commandKey]) {
		commandKey = aliases[commandKey];
		// Parse aliased command
		const aliasParts = commandKey.split(" ");
		args.command = aliasParts;
	}

	// Check if it's a parent command without subcommand
	if (parentCommands.has(commandKey)) {
		showCommandHelp([commandKey]);
		return;
	}

	// Find handler
	const handler = routes[commandKey];

	if (!handler) {
		console.log(error(`Unknown command: ${commandKey}`));
		console.log(`Run 'deepdex help' for available commands.`);
		process.exit(1);
	}

	try {
		await handler(args);
	} catch (err) {
		if (err instanceof Error) {
			console.log(error(err.message));
			if (args.flags.verbose) {
				console.error(err.stack);
			}
		} else {
			console.log(error(String(err)));
		}
		process.exit(1);
	}
}
