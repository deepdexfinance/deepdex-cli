/**
 * Configuration management for DeepDex CLI
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { DeepDexConfig } from "../types/index.ts";
import {
	CONFIG_PATH as CONFIG_PATH_CONST,
	DEEPDEX_HOME,
	DEFAULT_CONFIG,
	LOGS_DIR,
} from "../utils/constants.ts";

// Re-export CONFIG_PATH for convenience
export const CONFIG_PATH = CONFIG_PATH_CONST;

// ============================================================================
// Configuration Management
// ============================================================================

/**
 * Ensure DeepDex home directory exists
 */
export function ensureDirectories(): void {
	if (!existsSync(DEEPDEX_HOME)) {
		mkdirSync(DEEPDEX_HOME, { recursive: true });
	}
	if (!existsSync(LOGS_DIR)) {
		mkdirSync(LOGS_DIR, { recursive: true });
	}
}

/**
 * Load configuration from disk
 */
export function loadConfig(): DeepDexConfig {
	ensureDirectories();

	if (!existsSync(CONFIG_PATH)) {
		return { ...DEFAULT_CONFIG };
	}

	try {
		const data = readFileSync(CONFIG_PATH, "utf8");
		const config = JSON.parse(data) as Partial<DeepDexConfig>;
		// Merge with defaults to ensure all fields exist
		return {
			...DEFAULT_CONFIG,
			...config,
			notifications: {
				...DEFAULT_CONFIG.notifications,
				...config.notifications,
			},
			trading: {
				...DEFAULT_CONFIG.trading,
				...config.trading,
			},
		};
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

/**
 * Save configuration to disk
 */
export function saveConfig(config: DeepDexConfig): void {
	ensureDirectories();
	writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Get a specific config value by dot-notation path
 */
export function getConfigValue(path: string): unknown {
	const config = loadConfig();
	const keys = path.split(".");
	let value: unknown = config;

	for (const key of keys) {
		if (value && typeof value === "object" && key in value) {
			value = (value as Record<string, unknown>)[key];
		} else {
			return undefined;
		}
	}

	return value;
}

/**
 * Set a specific config value by dot-notation path
 */
export function setConfigValue(path: string, value: unknown): void {
	const config = loadConfig();
	const keys = path.split(".");
	let current: Record<string, unknown> = config as unknown as Record<
		string,
		unknown
	>;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i]!;
		if (!(key in current) || typeof current[key] !== "object") {
			current[key] = {};
		}
		current = current[key] as Record<string, unknown>;
	}

	const lastKey = keys[keys.length - 1]!;
	current[lastKey] = value;

	saveConfig(config);
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
	saveConfig({ ...DEFAULT_CONFIG });
}

/**
 * Check if configuration exists
 */
export function configExists(): boolean {
	return existsSync(CONFIG_PATH);
}

// ============================================================================
// Config Validation
// ============================================================================

export const VALID_CONFIG_KEYS = [
	"default_account",
	"rpc_url",
	"confirmations",
	"output_format",
	"notifications.discord_webhook",
	"notifications.telegram_bot",
	"trading.default_leverage",
	"trading.max_slippage",
	"trading.auto_approve",
];

/**
 * Check if a config key is valid
 */
export function isValidConfigKey(key: string): boolean {
	return VALID_CONFIG_KEYS.includes(key);
}

/**
 * Get list of valid config keys
 */
export function getValidConfigKeys(): string[] {
	return [...VALID_CONFIG_KEYS];
}

/**
 * Parse and validate config value based on key
 */
export function parseConfigValue(key: string, value: string): unknown {
	switch (key) {
		case "confirmations":
		case "trading.auto_approve":
			return value.toLowerCase() === "true";
		case "trading.default_leverage":
			return Number.parseInt(value, 10);
		case "trading.max_slippage":
			return Number.parseFloat(value);
		case "output_format":
			if (value !== "table" && value !== "json") {
				throw new Error('output_format must be "table" or "json"');
			}
			return value;
		default:
			return value;
	}
}
