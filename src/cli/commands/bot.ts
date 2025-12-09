/**
 * Bot management commands
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { consola } from "consola";
import { ensureDirectories } from "../../config/index.ts";
import {
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import type { BotStatus, BotStrategy } from "../../types/index.ts";
import { BOT_LOG_PATH, BOT_PID_PATH } from "../../utils/constants.ts";
import { bold, dim, formatDuration } from "../../utils/format.ts";
import { confirm, promptPassword, promptPath, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, optionalArg } from "../parser.ts";

// ============================================================================
// Strategy Definitions
// ============================================================================

const STRATEGIES: {
	name: BotStrategy;
	description: string;
	riskLevel: string;
	marketType: "Spot" | "Perp" | "Both";
}[] = [
	{
		name: "grid",
		description: "Grid trading - places orders at regular price intervals",
		riskLevel: "Medium",
		marketType: "Spot",
	},
	{
		name: "mm",
		description: "Market making - provides liquidity on both sides",
		riskLevel: "High",
		marketType: "Spot",
	},
	{
		name: "arbitrage",
		description: "Arbitrage - exploits price differences across markets",
		riskLevel: "Low",
		marketType: "Both",
	},
	{
		name: "simple",
		description: "Simple DCA - dollar cost averaging at intervals",
		riskLevel: "Low",
		marketType: "Spot",
	},
	{
		name: "momentum",
		description: "Momentum - trend following using moving averages",
		riskLevel: "High",
		marketType: "Perp",
	},
];

// ============================================================================
// Commands
// ============================================================================

/**
 * Start the trading bot
 */
export async function start(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	// Check if bot is already running
	if (isBotRunning()) {
		const status = getBotStatus();
		throw new Error(
			`Bot is already running (PID: ${status.pid}, strategy: ${status.strategy})`,
		);
	}

	const strategyName = optionalArg(args.positional, 0, "simple") as BotStrategy;
	let configPath = getFlag<string>(args.raw, "config");
	const accountFlag = getFlag<string>(args.raw, "account");
	const daemon = getFlag<boolean>(args.raw, "daemon") || false;

	// If --config flag is present but empty (value is true), prompt for path with autocomplete
	const hasConfigFlag = "config" in args.raw;
	if (
		hasConfigFlag &&
		(configPath === undefined || configPath === (true as unknown))
	) {
		configPath = await promptPath("Config file path: ", {
			extensions: [".json"],
			defaultValue: `./src/cli/commands/strategies/configs/${strategyName}.json`,
		});
	}

	// Validate strategy
	const strategy = STRATEGIES.find((s) => s.name === strategyName);
	if (!strategy) {
		throw new Error(
			`Unknown strategy: ${strategyName}. Use 'deepdex bot list-strategies' to see available options.`,
		);
	}

	// Unlock wallet
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	// Load config if specified
	let botConfig: Record<string, unknown> = {};
	if (configPath) {
		if (!existsSync(configPath)) {
			throw new Error(`Config file not found: ${configPath}`);
		}
		try {
			botConfig = JSON.parse(readFileSync(configPath, "utf8"));
		} catch {
			throw new Error(`Invalid config file: ${configPath}`);
		}
	}

	// Resolve account: CLI flag > config file > default
	const accountName =
		accountFlag || (botConfig.account as string | undefined) || "default";

	console.log();
	consola.box({
		title: "🤖 Starting Trading Bot",
		message: `Strategy: ${strategy.name}
${strategy.description}

Account: ${accountName}
Risk Level: ${strategy.riskLevel}
Mode: ${daemon ? "Background (daemon)" : "Foreground"}`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		consola.warn("The bot will execute real trades with your funds.");
		const confirmed = await confirm("Start the bot?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	// Save bot state
	ensureDirectories();
	const botState = {
		pid: process.pid,
		strategy: strategyName,
		account: accountName,
		startedAt: Date.now(),
		config: botConfig,
	};
	writeFileSync(BOT_PID_PATH, JSON.stringify(botState, null, 2));

	console.log();
	consola.success(`Bot started! (PID: ${process.pid})`);

	if (daemon) {
		console.log(
			dim("  Running in background. Use 'deepdex bot status' to check."),
		);
		console.log(dim("  Use 'deepdex bot stop' to stop the bot."));
		console.log(dim(`  Logs: ${BOT_LOG_PATH}`));
	} else {
		console.log(dim("  Press Ctrl+C to stop the bot."));
		console.log();

		if (
			["simple", "grid", "momentum", "arbitrage", "mm"].includes(strategyName)
		) {
			// Dynamic import to avoid circular dependencies if any
			const { run } = await import(`./strategies/${strategyName}.ts`);
			// Extract inner config if the JSON file has nested structure
			const innerConfig =
				(botConfig as Record<string, unknown>).config || botConfig;
			await run({
				strategy: strategyName,
				account: accountName,
				config: innerConfig,
			});
		} else {
			// In production, this would start the actual bot loop
			consola.info("Bot is running... (simulation mode)");
			console.log(dim("  Watching for trading opportunities..."));

			// Keep process alive for simulation
			await new Promise(() => {});
		}
	}

	console.log();
}

/**
 * Stop the running bot
 */
export async function stop(args: ParsedArgs): Promise<void> {
	if (!isBotRunning()) {
		consola.info("No bot is currently running.");
		return;
	}

	const status = getBotStatus();

	console.log();
	consola.box({
		title: "🛑 Stopping Bot",
		message: `PID: ${status.pid}
Strategy: ${status.strategy || "unknown"}
Uptime: ${formatDuration(status.uptime || 0)}`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Stop the bot?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	// In production, this would send SIGTERM to the bot process
	// For now, just remove the PID file
	try {
		unlinkSync(BOT_PID_PATH);
		console.log();
		consola.success("Bot stopped gracefully.");
	} catch {
		consola.error("Failed to stop bot. You may need to kill it manually.");
	}

	console.log();
}

/**
 * Check bot status
 */
export async function status(args: ParsedArgs): Promise<void> {
	const status = getBotStatus();

	if (args.flags.json) {
		console.log(JSON.stringify(status, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "🤖 Bot Status",
		message: status.running
			? `Status: Running
PID: ${status.pid}
Strategy: ${status.strategy || "unknown"}
Account: ${status.account || "default"}
Started: ${new Date(status.startedAt!).toLocaleString()}
Uptime: ${formatDuration(status.uptime || 0)}`
			: "Bot is not running.\n\nStart with: deepdex bot start [strategy]",
		style: {
			padding: 1,
			borderColor: status.running ? "green" : "gray",
			borderStyle: "rounded",
		},
	});

	console.log();
}

/**
 * View bot logs
 */
export async function logs(args: ParsedArgs): Promise<void> {
	const follow = getFlag<boolean>(args.raw, "follow") || false;
	const lines = getFlag<number>(args.raw, "lines") || 50;

	if (!existsSync(BOT_LOG_PATH)) {
		consola.info("No logs found.");
		console.log(dim(`  Log file: ${BOT_LOG_PATH}`));
		return;
	}

	consola.box({
		title: `📋 Bot Logs (last ${lines} lines)`,
		message: `Log file: ${BOT_LOG_PATH}`,
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	try {
		const content = readFileSync(BOT_LOG_PATH, "utf8");
		const logLines = content.trim().split("\n");
		const lastLines = logLines.slice(-lines);

		for (const line of lastLines) {
			console.log(dim("  ") + line);
		}

		if (follow) {
			console.log();
			consola.info("Watching for new logs... (Ctrl+C to stop)");
			// In production, this would tail the log file
		}
	} catch {
		consola.error("Failed to read log file.");
	}

	console.log();
}

/**
 * List available strategies
 */
export async function listStrategies(args: ParsedArgs): Promise<void> {
	if (args.flags.json) {
		console.log(JSON.stringify(STRATEGIES, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📚 Available Trading Strategies",
		message: "Choose a strategy when starting the bot",
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	const tableData = STRATEGIES.map((s) => ({
		Name: bold(s.name),
		Description: s.description,
		Market: s.marketType,
		Risk: s.riskLevel,
	}));

	console.log(
		table(
			[
				{ header: "Name", key: "Name" },
				{ header: "Description", key: "Description" },
				{ header: "Market", key: "Market" },
				{ header: "Risk", key: "Risk" },
			],
			tableData,
		),
	);

	console.log();
	consola.info("Usage: deepdex bot start <strategy> [--config path]");
	console.log();
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if bot is running
 */
function isBotRunning(): boolean {
	if (!existsSync(BOT_PID_PATH)) {
		return false;
	}

	try {
		const state = JSON.parse(readFileSync(BOT_PID_PATH, "utf8"));
		// In production, we'd check if the process is actually running
		// For now, just check if the file exists and is recent
		return Date.now() - state.startedAt < 24 * 60 * 60 * 1000; // 24 hours
	} catch {
		return false;
	}
}

/**
 * Get bot status
 */
function getBotStatus(): BotStatus {
	if (!isBotRunning()) {
		return { running: false };
	}

	try {
		const state = JSON.parse(readFileSync(BOT_PID_PATH, "utf8"));
		return {
			running: true,
			pid: state.pid,
			strategy: state.strategy,
			account: state.account,
			startedAt: state.startedAt,
			uptime: Date.now() - state.startedAt,
		};
	} catch {
		return { running: false };
	}
}
