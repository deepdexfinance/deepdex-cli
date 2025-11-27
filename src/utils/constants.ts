/**
 * Constants for DeepDex CLI
 */

import { homedir } from "node:os";
import { join } from "node:path";

// ============================================================================
// Paths
// ============================================================================

export const DEEPDEX_HOME = join(homedir(), ".deepdex");
export const CONFIG_PATH = join(DEEPDEX_HOME, "config.json");
export const WALLET_PATH = join(DEEPDEX_HOME, "wallet.json");
export const BOT_PID_PATH = join(DEEPDEX_HOME, "bot.pid");
export const LOGS_DIR = join(DEEPDEX_HOME, "logs");
export const BOT_LOG_PATH = join(LOGS_DIR, "bot.log");

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG = {
	default_account: "main",
	rpc_url: "https://rpc-testnet.deepdex.finance",
	confirmations: true,
	output_format: "table" as const,
	notifications: {
		discord_webhook: null,
		telegram_bot: null,
	},
	trading: {
		default_leverage: 1,
		max_slippage: 0.5,
		auto_approve: false,
	},
};

// ============================================================================
// CLI Styling
// ============================================================================

export const COLORS = {
	// Status colors
	success: "\x1b[32m", // Green
	error: "\x1b[31m", // Red
	warning: "\x1b[33m", // Yellow
	info: "\x1b[36m", // Cyan

	// Trading colors
	buy: "\x1b[32m", // Green
	sell: "\x1b[31m", // Red
	long: "\x1b[36m", // Cyan
	short: "\x1b[35m", // Magenta

	// Price colors
	up: "\x1b[32m", // Green
	down: "\x1b[31m", // Red

	// UI colors
	dim: "\x1b[2m",
	bold: "\x1b[1m",
	reset: "\x1b[0m",
	underline: "\x1b[4m",

	// Additional colors
	white: "\x1b[37m",
	gray: "\x1b[90m",
	blue: "\x1b[34m",
} as const;

export const SYMBOLS = {
	success: "✓",
	error: "✗",
	warning: "⚠",
	pending: "⏳",
	arrow: "→",
	bullet: "•",
	line: "─",
	corner: {
		tl: "┌",
		tr: "┐",
		bl: "└",
		br: "┘",
	},
	border: {
		h: "─",
		v: "│",
		cross: "┼",
		tee: {
			l: "├",
			r: "┤",
			t: "┬",
			b: "┴",
		},
	},
} as const;

// ============================================================================
// Version
// ============================================================================

export const VERSION = "1.0.0";
export const CLI_NAME = "deepdex";

// ============================================================================
// Trading Constants
// ============================================================================

export const MAX_LEVERAGE = 50;
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const PRICE_DECIMALS = 6;
export const USDC_DECIMALS = 6;

// Order types (matching contract)
export const ORDER_TYPES = {
	MARKET: 0,
	LIMIT: 1,
} as const;

// Order status (matching contract)
export const ORDER_STATUS = {
	OPEN: 0,
	FILLED: 1,
	CANCELLED: 2,
	PARTIAL: 3,
} as const;

// ============================================================================
// Help Text
// ============================================================================

export const BANNER = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      ██████╗ ███████╗███████╗██████╗ ██████╗ ███████╗██╗  ║
║      ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝╚██╗ ║
║      ██║  ██║█████╗  █████╗  ██████╔╝██║  ██║█████╗   ╚██╗║
║      ██║  ██║██╔══╝  ██╔══╝  ██╔═══╝ ██║  ██║██╔══╝   ██╔╝║
║      ██████╔╝███████╗███████╗██║     ██████╔╝███████╗██╔╝ ║
║      ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═════╝ ╚══════╝╚═╝  ║
║                                                           ║
║        High-Performance Trading CLI for DeepDex           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;
