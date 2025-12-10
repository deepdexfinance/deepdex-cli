/**
 * Help system for DeepDex CLI
 */

import { consola } from "consola";
import { BANNER, VERSION } from "../utils/constants.ts";
import { bold, dim } from "../utils/format.ts";

// ============================================================================
// Command Definitions
// ============================================================================

interface CommandHelp {
	description: string;
	usage: string;
	examples?: string[];
	options?: { flag: string; description: string }[];
	subcommands?: { name: string; description: string }[];
}

const COMMANDS: Record<string, CommandHelp> = {
	init: {
		description: "Initialize wallet and configuration",
		usage: "deepdex init",
		examples: ["deepdex init", "deepdex init --import"],
	},
	wallet: {
		description: "Multi-wallet management commands",
		usage: "deepdex wallet <command>",
		subcommands: [
			{ name: "list", description: "List all wallets" },
			{ name: "info", description: "Display wallet address and balances" },
			{ name: "create", description: "Create a new wallet" },
			{ name: "switch", description: "Switch active wallet" },
			{ name: "rename", description: "Rename a wallet" },
			{ name: "delete", description: "Delete a wallet" },
			{
				name: "export",
				description: "Export private key (requires confirmation)",
			},
			{ name: "import", description: "Import wallet from private key" },
			{ name: "sign", description: "Sign an arbitrary message" },
			{
				name: "transfer",
				description: "Transfer tokens to another wallet or address",
			},
		],
	},
	"wallet list": {
		description: "List all wallets with their addresses",
		usage: "deepdex wallet list",
		examples: ["deepdex wallet list", "deepdex wallet list --json"],
	},
	"wallet info": {
		description: "Display wallet address, balance, and nonce",
		usage: "deepdex wallet info [name]",
		examples: [
			"deepdex wallet info",
			"deepdex wallet info trading",
			"deepdex wallet info --json",
		],
	},
	"wallet create": {
		description: "Create a new wallet with optional name",
		usage: "deepdex wallet create [name]",
		examples: [
			"deepdex wallet create",
			"deepdex wallet create trading",
			"deepdex wallet create bot-wallet",
		],
	},
	"wallet switch": {
		description: "Switch to a different wallet",
		usage: "deepdex wallet switch <name>",
		examples: [
			"deepdex wallet switch trading",
			"deepdex wallet switch default",
		],
	},
	"wallet rename": {
		description: "Rename an existing wallet",
		usage: "deepdex wallet rename <current_name> <new_name>",
		examples: ["deepdex wallet rename default main-wallet"],
	},
	"wallet delete": {
		description: "Delete a wallet (requires confirmation)",
		usage: "deepdex wallet delete <name>",
		examples: ["deepdex wallet delete old-wallet"],
	},
	"wallet export": {
		description: "Export private key (requires confirmation)",
		usage: "deepdex wallet export [name]",
		examples: ["deepdex wallet export", "deepdex wallet export trading"],
	},
	"wallet import": {
		description: "Import wallet from private key",
		usage: "deepdex wallet import <private_key> [name]",
		examples: [
			"deepdex wallet import 0x...",
			"deepdex wallet import 0x... trading",
		],
	},
	"wallet transfer": {
		description: "Transfer tokens to another wallet or address",
		usage: "deepdex wallet transfer <amount> <token> [recipient]",
		examples: [
			"deepdex wallet transfer 10 USDC trading",
			"deepdex wallet transfer 50% USDC trading",
			"deepdex wallet transfer 100% tDGAS 0x1234...",
		],
		options: [
			{ flag: "--to", description: "Recipient address or wallet name" },
		],
	},
	account: {
		description: "Subaccount management commands",
		usage: "deepdex account <command>",
		subcommands: [
			{ name: "create", description: "Create a new subaccount" },
			{ name: "list", description: "List all subaccounts" },
			{ name: "info", description: "Display subaccount details" },
			{ name: "deposit", description: "Deposit tokens to subaccount" },
			{ name: "withdraw", description: "Withdraw tokens from subaccount" },
			{ name: "delegate", description: "Delegate trading authority" },
		],
	},
	"account create": {
		description: "Create a new subaccount on-chain",
		usage: "deepdex account create [name]",
		examples: ["deepdex account create", "deepdex account create trading-main"],
	},
	"account list": {
		description: "List all your subaccounts",
		usage: "deepdex account list",
		examples: ["deepdex account list", "deepdex account list --json"],
	},
	"account deposit": {
		description: "Deposit tokens into a subaccount",
		usage: "deepdex account deposit <amount> <token>",
		examples: [
			"deepdex account deposit 1000 USDC",
			"deepdex account deposit 50% USDC",
			"deepdex account deposit 100% tDGAS --account trading-main",
		],
		options: [{ flag: "--account, -a", description: "Target subaccount name" }],
	},
	"account withdraw": {
		description: "Withdraw tokens from a subaccount",
		usage: "deepdex account withdraw <amount> <token>",
		examples: [
			"deepdex account withdraw 500 USDC",
			"deepdex account withdraw 50% USDC",
			"deepdex account withdraw 100% ETH --account trading-main",
		],
		options: [{ flag: "--account, -a", description: "Source subaccount name" }],
	},
	faucet: {
		description: "Mint testnet tokens",
		usage: "deepdex faucet [--token <USDC|tDGAS>]",
		examples: ["deepdex faucet", "deepdex faucet --token tDGAS"],
		options: [
			{ flag: "--token", description: "Token to mint (default: USDC)" },
		],
	},
	market: {
		description: "Market data commands",
		usage: "deepdex market <command>",
		subcommands: [
			{ name: "list", description: "List all available markets" },
			{ name: "info", description: "Market specifications" },
			{ name: "orderbook", description: "Display orderbook depth" },
			{ name: "trades", description: "Recent trade history" },
			{ name: "price", description: "Current prices" },
			{ name: "funding", description: "Funding rate history" },
		],
	},
	"market list": {
		description: "List all available spot and perpetual markets",
		usage: "deepdex market list",
		examples: ["deepdex market list", "deepdex market list --json"],
	},
	"market info": {
		description: "Display detailed market specifications",
		usage: "deepdex market info <pair>",
		examples: ["deepdex market info ETH/USDC", "deepdex market info ETH-USDC"],
	},
	"market price": {
		description: "Display current oracle and mark prices",
		usage: "deepdex market price <pair>",
		examples: ["deepdex market price ETH-USDC"],
	},
	balance: {
		description: "Display token balances across wallet and subaccounts",
		usage: "deepdex balance",
		examples: ["deepdex balance", "deepdex balance --account trading-main"],
		options: [{ flag: "--account, -a", description: "Filter by subaccount" }],
	},
	portfolio: {
		description: "Portfolio summary with P&L and margin usage",
		usage: "deepdex portfolio",
		examples: ["deepdex portfolio", "deepdex portfolio --json"],
	},
	spot: {
		description: "Spot trading commands",
		usage: "deepdex spot <buy|sell>",
		subcommands: [
			{ name: "buy", description: "Execute a spot buy order" },
			{ name: "sell", description: "Execute a spot sell order" },
		],
	},
	"spot buy": {
		description: "Execute a spot buy order",
		usage: "deepdex spot buy <pair> <amount> [options]",
		examples: [
			"deepdex spot buy ETH/USDC 1.5",
			"deepdex spot buy ETH/USDC 50%",
			"deepdex spot buy ETH/USDC 1.5 --price 2000",
		],
		options: [
			{
				flag: "--price",
				description: "Limit price (omit for market order)",
			},
			{ flag: "--post-only", description: "Ensure order is maker only" },
			{ flag: "--account, -a", description: "Specify subaccount" },
		],
	},
	"spot sell": {
		description: "Execute a spot sell order",
		usage: "deepdex spot sell <pair> <amount> [options]",
		examples: [
			"deepdex spot sell ETH/USDC 1.5",
			"deepdex spot sell ETH/USDC 50%",
			"deepdex spot sell ETH/USDC 100% --reduce-only",
		],
		options: [
			{
				flag: "--price",
				description: "Limit price (omit for market order)",
			},
			{
				flag: "--reduce-only",
				description: "Only reduce existing position",
			},
			{ flag: "--account, -a", description: "Specify subaccount" },
		],
	},
	perp: {
		description: "Perpetual trading commands",
		usage: "deepdex perp <long|short>",
		subcommands: [
			{ name: "long", description: "Open a long position" },
			{ name: "short", description: "Open a short position" },
		],
	},
	"perp long": {
		description: "Open a long perpetual position",
		usage: "deepdex perp long <pair> <amount> [options]",
		examples: [
			"deepdex perp long ETH-USDC 1.5 --lev 10",
			"deepdex perp long ETH-USDC 50% --lev 10",
			"deepdex perp long ETH-USDC 100% --lev 5 --tp 2200 --sl 1900",
		],
		options: [
			{
				flag: "--lev, --leverage",
				description: "Leverage multiplier (default: 1)",
			},
			{
				flag: "--price",
				description: "Limit price (omit for market order)",
			},
			{ flag: "--tp", description: "Take-profit price" },
			{ flag: "--sl", description: "Stop-loss price" },
			{
				flag: "--reduce-only",
				description: "Only reduce existing position",
			},
			{ flag: "--account, -a", description: "Specify subaccount" },
		],
	},
	"perp short": {
		description: "Open a short perpetual position",
		usage: "deepdex perp short <pair> <amount> [options]",
		examples: [
			"deepdex perp short SOL-USDC 50 --lev 5",
			"deepdex perp short SOL-USDC 25% --lev 3",
			"deepdex perp short SOL-USDC 100% --lev 2 --tp 20 --sl 28",
		],
		options: [
			{
				flag: "--lev, --leverage",
				description: "Leverage multiplier (default: 1)",
			},
			{
				flag: "--price",
				description: "Limit price (omit for market order)",
			},
			{ flag: "--tp", description: "Take-profit price" },
			{ flag: "--sl", description: "Stop-loss price" },
			{
				flag: "--reduce-only",
				description: "Only reduce existing position",
			},
			{ flag: "--account, -a", description: "Specify subaccount" },
		],
	},
	order: {
		description: "Order management commands",
		usage: "deepdex order <command>",
		subcommands: [
			{ name: "list", description: "List open orders" },
			{ name: "cancel", description: "Cancel a specific order" },
			{ name: "cancel-all", description: "Cancel all open orders" },
			{ name: "history", description: "View order history" },
		],
	},
	"order list": {
		description: "List all open orders",
		usage: "deepdex order list [options]",
		examples: ["deepdex order list", "deepdex order list --market ETH-USDC"],
		options: [
			{ flag: "--market", description: "Filter by market" },
			{ flag: "--account, -a", description: "Filter by subaccount" },
		],
	},
	"order cancel": {
		description: "Cancel a specific order",
		usage: "deepdex order cancel <order_id>",
		examples: ["deepdex order cancel 0x1234..."],
	},
	"order cancel-all": {
		description: "Cancel all open orders (requires confirmation)",
		usage: "deepdex order cancel-all [options]",
		examples: [
			"deepdex order cancel-all",
			"deepdex order cancel-all --market ETH-USDC",
			"deepdex order cancel-all --yes",
		],
		options: [
			{ flag: "--market", description: "Cancel only for this market" },
			{ flag: "--yes, -y", description: "Skip confirmation" },
		],
	},
	position: {
		description: "Position management commands",
		usage: "deepdex position <command>",
		subcommands: [
			{ name: "list", description: "List all open positions" },
			{ name: "info", description: "Display position details" },
			{ name: "close", description: "Close a position" },
			{ name: "modify", description: "Modify TP/SL levels" },
		],
	},
	"position list": {
		description: "List all open perpetual positions",
		usage: "deepdex position list",
		examples: ["deepdex position list", "deepdex position list --json"],
	},
	"position close": {
		description: "Close a perpetual position",
		usage: "deepdex position close <market>",
		examples: [
			"deepdex position close ETH-USDC",
			"deepdex position close ETH-USDC --size 0.5",
			"deepdex position close ETH-USDC --size 50%",
		],
		options: [{ flag: "--size", description: "Partial close size (number or %)" }],
	},
	"position modify": {
		description: "Modify take-profit and stop-loss levels",
		usage: "deepdex position modify <market> [options]",
		examples: ["deepdex position modify ETH-USDC --tp 2500 --sl 2000"],
		options: [
			{ flag: "--tp", description: "New take-profit price" },
			{ flag: "--sl", description: "New stop-loss price" },
		],
	},
	bot: {
		description: "Trading bot commands",
		usage: "deepdex bot <command>",
		subcommands: [
			{ name: "start", description: "Start the trading bot" },
			{ name: "stop", description: "Stop the running bot" },
			{ name: "status", description: "Check bot status" },
			{ name: "logs", description: "View bot logs" },
			{ name: "list-strategies", description: "List available strategies" },
		],
	},
	"bot start": {
		description: "Start the automated trading bot",
		usage: "deepdex bot start [strategy] [options]",
		examples: [
			"deepdex bot start",
			"deepdex bot start grid --config ./grid.json",
		],
		options: [
			{ flag: "--config", description: "Path to strategy config file" },
			{ flag: "--account, -a", description: "Subaccount to use" },
			{ flag: "--daemon", description: "Run in background" },
		],
	},
	config: {
		description: "Configuration management",
		usage: "deepdex config <command>",
		subcommands: [
			{ name: "show", description: "Display current configuration" },
			{ name: "set", description: "Update a configuration value" },
			{ name: "reset", description: "Reset to defaults" },
		],
	},
	"config show": {
		description: "Display current configuration",
		usage: "deepdex config show",
		examples: ["deepdex config show", "deepdex config show --json"],
	},
	"config set": {
		description: "Update a configuration value",
		usage: "deepdex config set <key> <value>",
		examples: [
			"deepdex config set default_account trading-main",
			"deepdex config set trading.default_leverage 5",
		],
	},
	health: {
		description: "Run system health checks",
		usage: "deepdex health [options]",
		examples: [
			"deepdex health",
			"deepdex health --json",
			"deepdex health --watch",
		],
		options: [
			{ flag: "--json", description: "Output in JSON format" },
			{ flag: "--watch", description: "Continuous monitoring" },
			{ flag: "--quiet", description: "Exit code only" },
		],
	},
	pm: {
		description: "Process manager for running multiple bots",
		usage: "deepdex pm <command>",
		subcommands: [
			{ name: "ps", description: "List all running processes" },
			{ name: "start", description: "Start a named process" },
			{ name: "stop", description: "Stop a process by name" },
			{ name: "restart", description: "Restart a process" },
			{ name: "logs", description: "View logs for a process" },
			{ name: "kill", description: "Force kill a process" },
			{ name: "stop-all", description: "Stop all running processes" },
		],
	},
	"pm ps": {
		description: "List all running processes with status",
		usage: "deepdex pm ps",
		examples: ["deepdex pm ps", "deepdex pm ps --json"],
	},
	"pm start": {
		description: "Start a new named bot process in the background",
		usage: "deepdex pm start <name> <strategy> [options]",
		examples: [
			"deepdex pm start eth-grid grid --config ./grid.json",
			"deepdex pm start btc-dca simple --config ./dca.json --account trading",
		],
		options: [
			{ flag: "--config", description: "Path to strategy config file" },
			{ flag: "--account, -a", description: "Subaccount to use" },
		],
	},
	"pm stop": {
		description: "Gracefully stop a process by name",
		usage: "deepdex pm stop <name>",
		examples: ["deepdex pm stop eth-grid", "deepdex pm stop eth-grid --yes"],
		options: [{ flag: "--yes, -y", description: "Skip confirmation" }],
	},
	"pm restart": {
		description: "Restart a process with the same configuration",
		usage: "deepdex pm restart <name>",
		examples: ["deepdex pm restart eth-grid"],
	},
	"pm logs": {
		description: "View logs for a specific process",
		usage: "deepdex pm logs <name> [options]",
		examples: [
			"deepdex pm logs eth-grid",
			"deepdex pm logs eth-grid --follow",
			"deepdex pm logs eth-grid -n 100",
		],
		options: [
			{ flag: "--follow, -f", description: "Follow log output (like tail -f)" },
			{
				flag: "--lines, -n",
				description: "Number of lines to show (default: 50)",
			},
		],
	},
	"pm kill": {
		description: "Force kill a process (SIGKILL)",
		usage: "deepdex pm kill <name>",
		examples: ["deepdex pm kill eth-grid"],
	},
	"pm stop-all": {
		description: "Stop all running processes",
		usage: "deepdex pm stop-all",
		examples: ["deepdex pm stop-all", "deepdex pm stop-all --yes"],
		options: [{ flag: "--yes, -y", description: "Skip confirmation" }],
	},
};

// ============================================================================
// Help Display Functions
// ============================================================================

/**
 * Display main help screen
 */
export function showMainHelp(): void {
	console.log(BANNER);
	console.log(`  ${dim("Version")} ${VERSION}\n`);

	consola.box({
		title: "DeepDex CLI",
		message: `High-performance trading bot for the DeepDex protocol

${bold("USAGE")}
  deepdex <command> [options]

${bold("SETUP")}
  init              Initialize wallet and configuration
  quickstart        Interactive setup wizard

${bold("WALLET & ACCOUNT")}
  wallet            Wallet management
  account           Subaccount management
  faucet            Mint testnet tokens
  balance           View token balances
  portfolio         Portfolio summary

${bold("MARKET DATA")}
  market            Market information and data

${bold("TRADING")}
  spot              Spot trading (buy/sell)
  perp              Perpetual trading (long/short)
  order             Order management
  position          Position management

${bold("AUTOMATION")}
  bot               Trading bot (foreground)
  pm                Process manager (background)

${bold("UTILITY")}
  config            Configuration management
  health            System health check
  history           Trade and transfer history

${bold("ALIASES")}
  buy  → spot buy     sell  → spot sell
  long → perp long    short → perp short

${bold("GLOBAL OPTIONS")}
  --account, -a     Specify subaccount
  --json            Output in JSON format
  --yes, -y         Skip confirmations
  --verbose, -v     Verbose output
  --dry-run         Simulate without executing
  --help, -h        Show help`,
		style: {
			padding: 1,
			borderColor: "magentaBright",
			borderStyle: "rounded",
		},
	});

	console.log(
		`\nRun ${dim("deepdex <command> --help")} for command-specific help.`,
	);
}

/**
 * Display help for a specific command
 */
export function showCommandHelp(commandPath: string[]): void {
	const key = commandPath.join(" ");
	const help = COMMANDS[key];

	if (!help) {
		consola.error(`Unknown command: ${key}`);
		consola.info(`Run 'deepdex help' for available commands.`);
		return;
	}

	console.log();
	consola.box({
		title: key.toUpperCase(),
		message: help.description,
		style: {
			padding: 1,
			borderColor: "magentaBright",
			borderStyle: "rounded",
		},
	});

	console.log(`\n${bold("USAGE")}`);
	console.log(`  ${help.usage}\n`);

	if (help.subcommands) {
		console.log(bold("SUBCOMMANDS"));
		for (const sub of help.subcommands) {
			console.log(`  ${sub.name.padEnd(16)} ${dim(sub.description)}`);
		}
		console.log();
	}

	if (help.options) {
		console.log(bold("OPTIONS"));
		for (const opt of help.options) {
			console.log(`  ${opt.flag.padEnd(20)} ${dim(opt.description)}`);
		}
		console.log();
	}

	if (help.examples) {
		console.log(bold("EXAMPLES"));
		for (const example of help.examples) {
			console.log(`  ${dim("$")} ${example}`);
		}
		console.log();
	}
}

/**
 * Check if help flag is present
 */
export function shouldShowHelp(raw: Record<string, unknown>): boolean {
	return raw.help === true || raw.h === true;
}
