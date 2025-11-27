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
export const LENDING_MARKET_ID = 1;

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

// Gradient colors: #c084fc (purple) -> #ff6e26 (orange)
const g = {
	l1: "\x1b[38;2;192;132;252m", // #c084fc
	l2: "\x1b[38;2;205;128;209m",
	l3: "\x1b[38;2;217;123;166m",
	l4: "\x1b[38;2;230;119;124m",
	l5: "\x1b[38;2;242;114;81m",
	l6: "\x1b[38;2;255;110;38m", // #ff6e26
	r: "\x1b[0m",
};

export const BANNER = `
${g.l1}╔═════════════════════════════════════════════════════════════════╗${g.r}
${g.l1}║${g.r}                                                                 ${g.l1}║${g.r}
${g.l1}║${g.r}   ${g.l1}██████╗ ███████╗███████╗██████╗ ██████╗ ███████╗██╗  ██╗${g.r}      ${g.l1}║${g.r}
${g.l2}║${g.r}   ${g.l2}██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝${g.r}      ${g.l2}║${g.r}
${g.l3}║${g.r}   ${g.l3}██║  ██║█████╗  █████╗  ██████╔╝██║  ██║█████╗   ╚███╔╝${g.r}       ${g.l3}║${g.r}
${g.l4}║${g.r}   ${g.l4}██║  ██║██╔══╝  ██╔══╝  ██╔═══╝ ██║  ██║██╔══╝   ██╔██╗${g.r}       ${g.l4}║${g.r}
${g.l5}║${g.r}   ${g.l5}██████╔╝███████╗███████╗██║     ██████╔╝███████╗██╔╝ ██╗${g.r}      ${g.l5}║${g.r}
${g.l6}║${g.r}   ${g.l6}╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═════╝ ╚══════╝╚═╝  ╚═╝${g.r}      ${g.l6}║${g.r}
${g.l6}║${g.r}                                                                 ${g.l6}║${g.r}
${g.l6}║${g.r}         ${g.l4}High-Performance Trading CLI for DeepDex${g.r}                ${g.l6}║${g.r}
${g.l6}║${g.r}                                                                 ${g.l6}║${g.r}
${g.l6}╚═════════════════════════════════════════════════════════════════╝${g.r}
`;
