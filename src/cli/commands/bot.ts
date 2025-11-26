/**
 * Bot management commands
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { ensureDirectories } from "../../config/index.ts";
import {
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import type { BotStatus, BotStrategy } from "../../types/index.ts";
import { BOT_LOG_PATH, BOT_PID_PATH } from "../../utils/constants.ts";
import {
	bold,
	dim,
	error,
	formatDuration,
	info,
	success,
	warning,
} from "../../utils/format.ts";
import { confirm, keyValue, promptPassword, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, optionalArg } from "../parser.ts";

// ============================================================================
// Strategy Definitions
// ============================================================================

const STRATEGIES: {
	name: BotStrategy;
	description: string;
	riskLevel: string;
}[] = [
	{
		name: "grid",
		description: "Grid trading - places orders at regular price intervals",
		riskLevel: "Medium",
	},
	{
		name: "mm",
		description: "Market making - provides liquidity on both sides",
		riskLevel: "High",
	},
	{
		name: "arbitrage",
		description: "Arbitrage - exploits price differences across markets",
		riskLevel: "Low",
	},
	{
		name: "simple",
		description: "Simple DCA - dollar cost averaging at intervals",
		riskLevel: "Low",
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
	const configPath = getFlag<string>(args.raw, "config");
	const accountName = getFlag<string>(args.raw, "account") || "default";
	const daemon = getFlag<boolean>(args.raw, "daemon") || false;

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
	let botConfig = {};
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

	console.log();
	console.log(bold("🤖 Starting Trading Bot\n"));
	console.log(
		keyValue(
			{
				Strategy: `${strategy.name} - ${strategy.description}`,
				Account: accountName,
				"Risk Level": strategy.riskLevel,
				Mode: daemon ? "Background (daemon)" : "Foreground",
			},
			2,
		),
	);

	// Confirm
	if (!args.flags.yes) {
		console.log();
		console.log(
			warning("⚠️  The bot will execute real trades with your funds."),
		);
		const confirmed = await confirm("Start the bot?", true);
		if (!confirmed) {
			console.log(info("Cancelled."));
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
	console.log(success(`Bot started! (PID: ${process.pid})`));

	if (daemon) {
		console.log(
			dim("  Running in background. Use 'deepdex bot status' to check."),
		);
		console.log(dim("  Use 'deepdex bot stop' to stop the bot."));
		console.log(dim(`  Logs: ${BOT_LOG_PATH}`));
	} else {
		console.log(dim("  Press Ctrl+C to stop the bot."));
		console.log();

		// In production, this would start the actual bot loop
		// For now, we simulate it
		console.log(info("Bot is running... (simulation mode)"));
		console.log(dim("  Watching for trading opportunities..."));

		// Note: In a real implementation, this would be an async event loop
		// that listens to price updates and executes trades
	}

	console.log();
}

/**
 * Stop the running bot
 */
export async function stop(args: ParsedArgs): Promise<void> {
	if (!isBotRunning()) {
		console.log(info("No bot is currently running."));
		return;
	}

	const status = getBotStatus();

	console.log();
	console.log(bold("🛑 Stopping Bot\n"));
	console.log(
		keyValue(
			{
				PID: status.pid?.toString(),
				Strategy: status.strategy || "unknown",
				Uptime: formatDuration(status.uptime || 0),
			},
			2,
		),
	);

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Stop the bot?", true);
		if (!confirmed) {
			console.log(info("Cancelled."));
			return;
		}
	}

	// In production, this would send SIGTERM to the bot process
	// For now, just remove the PID file
	try {
		unlinkSync(BOT_PID_PATH);
		console.log();
		console.log(success("Bot stopped gracefully."));
	} catch {
		console.log(error("Failed to stop bot. You may need to kill it manually."));
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

	console.log(bold("\n🤖 Bot Status\n"));

	if (!status.running) {
		console.log(dim("  Bot is not running."));
		console.log(dim("  Start with: deepdex bot start [strategy]"));
		console.log();
		return;
	}

	console.log(
		keyValue(
			{
				Status: "✓ Running",
				PID: status.pid?.toString(),
				Strategy: status.strategy || "unknown",
				Account: status.account || "default",
				"Started At": new Date(status.startedAt!).toLocaleString(),
				Uptime: formatDuration(status.uptime || 0),
			},
			2,
		),
	);
	console.log();
}

/**
 * View bot logs
 */
export async function logs(args: ParsedArgs): Promise<void> {
	const follow = getFlag<boolean>(args.raw, "follow") || false;
	const lines = getFlag<number>(args.raw, "lines") || 50;

	if (!existsSync(BOT_LOG_PATH)) {
		console.log(info("No logs found."));
		console.log(dim(`  Log file: ${BOT_LOG_PATH}`));
		return;
	}

	console.log(bold(`\n📋 Bot Logs (last ${lines} lines)\n`));

	try {
		const content = readFileSync(BOT_LOG_PATH, "utf8");
		const logLines = content.trim().split("\n");
		const lastLines = logLines.slice(-lines);

		for (const line of lastLines) {
			console.log(dim("  ") + line);
		}

		if (follow) {
			console.log();
			console.log(dim("  Watching for new logs... (Ctrl+C to stop)"));
			// In production, this would tail the log file
		}
	} catch {
		console.log(error("Failed to read log file."));
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

	console.log(bold("\n📚 Available Trading Strategies\n"));

	const tableData = STRATEGIES.map((s) => ({
		Name: s.name,
		Description: s.description,
		Risk: s.riskLevel,
	}));

	console.log(
		table(
			[
				{ header: "Name", key: "Name" },
				{ header: "Description", key: "Description" },
				{ header: "Risk", key: "Risk" },
			],
			tableData,
		),
	);

	console.log(dim("\nUsage: deepdex bot start <strategy> [--config path]"));
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
