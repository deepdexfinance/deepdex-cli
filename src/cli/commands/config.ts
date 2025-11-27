/**
 * Config commands - Configuration management
 */

import { consola } from "consola";
import {
	CONFIG_PATH,
	loadConfig,
	resetConfig,
	setConfigValue,
	VALID_CONFIG_KEYS,
} from "../../config/index.ts";
import { dim } from "../../utils/format.ts";
import { confirm, keyValue } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { requireArg } from "../parser.ts";

/**
 * Show current configuration
 */
export async function show(args: ParsedArgs): Promise<void> {
	const config = loadConfig();

	if (args.flags.json) {
		console.log(JSON.stringify(config, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "⚙️ Configuration",
		message: `Path: ${CONFIG_PATH}`,
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	// Flatten config for display
	const flatConfig: Record<string, string> = {};

	flatConfig.rpc_url = config.rpc_url;
	flatConfig.default_account = config.default_account;

	if (config.trading) {
		flatConfig["trading.default_leverage"] =
			config.trading.default_leverage?.toString() || "1";
		flatConfig["trading.max_slippage"] =
			config.trading.max_slippage?.toString() || "0.5";
		flatConfig["trading.auto_approve"] =
			config.trading.auto_approve?.toString() || "false";
	}

	console.log(keyValue(flatConfig, 2));

	console.log();
	consola.info(`Set values with: deepdex config set <key> <value>`);
	console.log(dim(`  Available keys: ${VALID_CONFIG_KEYS.join(", ")}`));
	console.log();
}

/**
 * Set a configuration value
 */
export async function set(args: ParsedArgs): Promise<void> {
	const key = requireArg(args.positional, 0, "key");
	const value = requireArg(args.positional, 1, "value");

	// Validate key
	if (!VALID_CONFIG_KEYS.includes(key)) {
		throw new Error(
			`Invalid config key: ${key}\nValid keys: ${VALID_CONFIG_KEYS.join(", ")}`,
		);
	}

	console.log();
	consola.box({
		title: "⚙️ Update Configuration",
		message: `Key: ${key}
Value: ${value}`,
		style: {
			padding: 1,
			borderColor: "yellow",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Apply this change?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	// Set value
	setConfigValue(key, value);

	console.log();
	consola.success(`Configuration updated: ${key} = ${value}`);
	console.log();
}

/**
 * Reset configuration to defaults
 */
export async function reset(args: ParsedArgs): Promise<void> {
	console.log();
	consola.box({
		title: "⚠️ Reset Configuration",
		message: "This will reset all settings to their default values.",
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		consola.warn("This action cannot be undone.");
		const confirmed = await confirm("Reset all configuration?", false);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	// Reset
	resetConfig();

	console.log();
	consola.success("Configuration reset to defaults.");
	console.log(dim("  View with: deepdex config show"));
	console.log();
}
