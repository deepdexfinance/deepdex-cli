/**
 * Formatting utilities for DeepDex CLI
 */

import { type Address, formatUnits } from "viem";
import { COLORS, SYMBOLS, USDC_DECIMALS } from "./constants.ts";

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format a bigint amount with decimals
 */
export function formatAmount(
	amount: bigint,
	decimals: number,
	precision = 4,
): string {
	const formatted = formatUnits(amount, decimals);
	const num = Number.parseFloat(formatted);

	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);

	return num.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: precision,
	});
}

/**
 * Format USD value
 */
export function formatUSD(amount: bigint, decimals = USDC_DECIMALS): string {
	const value = Number(formatUnits(amount, decimals));
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

/**
 * Format price with color based on direction
 */
export function formatPrice(
	price: bigint,
	decimals: number,
	prevPrice?: bigint,
): string {
	const formatted = formatAmount(price, decimals, 2);

	if (prevPrice === undefined) return formatted;

	if (price > prevPrice) {
		return `${COLORS.up}${formatted}${COLORS.reset}`;
	}
	if (price < prevPrice) {
		return `${COLORS.down}${formatted}${COLORS.reset}`;
	}
	return formatted;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, showSign = true): string {
	const sign = showSign && value > 0 ? "+" : "";
	const color = value >= 0 ? COLORS.up : COLORS.down;
	return `${color}${sign}${value.toFixed(2)}%${COLORS.reset}`;
}

/**
 * Format P&L with color
 */
export function formatPnL(pnl: bigint, decimals = USDC_DECIMALS): string {
	const _value = Number(formatUnits(pnl, decimals));
	const formatted = formatUSD(pnl >= 0n ? pnl : -pnl, decimals);
	const sign = pnl >= 0n ? "+" : "-";
	const color = pnl >= 0n ? COLORS.up : COLORS.down;

	return `${color}${sign}${formatted.replace("$", "")}${COLORS.reset}`;
}

// ============================================================================
// Address Formatting
// ============================================================================

/**
 * Truncate address for display
 */
export function truncateAddress(address: Address, chars = 4): string {
	return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
	return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format duration in human readable form
 */
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

/**
 * Format relative time (e.g., "2s ago", "5m ago")
 */
export function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp * 1000;
	return `${formatDuration(diff)} ago`;
}

// ============================================================================
// Trading Formatting
// ============================================================================

/**
 * Format order side with color
 */
export function formatSide(
	side: "buy" | "sell" | "long" | "short",
	uppercase = true,
): string {
	const text = uppercase ? side.toUpperCase() : side;
	const color = side === "buy" || side === "long" ? COLORS.buy : COLORS.sell;
	return `${color}${text}${COLORS.reset}`;
}

/**
 * Format leverage
 */
export function formatLeverage(leverage: number): string {
	return `${leverage}x`;
}

/**
 * Format market pair
 */
export function formatPair(pair: string): string {
	return `${COLORS.bold}${pair}${COLORS.reset}`;
}

// ============================================================================
// Status Formatting
// ============================================================================

/**
 * Format success message
 */
export function success(message: string): string {
	return `${COLORS.success}${SYMBOLS.success}${COLORS.reset} ${message}`;
}

/**
 * Format error message
 */
export function error(message: string): string {
	return `${COLORS.error}${SYMBOLS.error}${COLORS.reset} ${message}`;
}

/**
 * Format warning message
 */
export function warning(message: string): string {
	return `${COLORS.warning}${SYMBOLS.warning}${COLORS.reset} ${message}`;
}

/**
 * Format info message
 */
export function info(message: string): string {
	return `${COLORS.info}ℹ${COLORS.reset} ${message}`;
}

/**
 * Format pending/loading message
 */
export function pending(message: string): string {
	return `${SYMBOLS.pending} ${message}`;
}

// ============================================================================
// Health Status Formatting
// ============================================================================

/**
 * Format health status
 */
export function formatHealthStatus(
	status: "ok" | "warning" | "critical",
): string {
	switch (status) {
		case "ok":
			return `${COLORS.success}${SYMBOLS.success}${COLORS.reset}`;
		case "warning":
			return `${COLORS.warning}${SYMBOLS.warning}${COLORS.reset}`;
		case "critical":
			return `${COLORS.error}${SYMBOLS.error}${COLORS.reset}`;
	}
}

// ============================================================================
// Misc Formatting
// ============================================================================

/**
 * Dim text
 */
export function dim(text: string): string {
	return `${COLORS.dim}${text}${COLORS.reset}`;
}

/**
 * Bold text
 */
export function bold(text: string): string {
	return `${COLORS.bold}${text}${COLORS.reset}`;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}

	return `${value.toFixed(1)} ${units[unitIndex]}`;
}
