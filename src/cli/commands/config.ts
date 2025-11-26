/**
 * Configuration management commands
 */

import {
	getConfigValue,
	getValidConfigKeys,
	isValidConfigKey,
	loadConfig,
	parseConfigValue,
	resetConfig,
	setConfigValue,
} from "../../config/index.ts";
import { CONFIG_PATH } from "../../utils/constants.ts";
import {
	bold,
	dim,
	error,
	info,
	success,
	warning,
} from "../../utils/format.ts";
import { confirm, keyValue } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { requireArg } from "../parser.ts";

/**
 * Display current configuration
 */
export async function show(args: ParsedArgs): Promise<void> {
	const config = loadConfig();

	if (args.flags.json) {
		console.log(JSON.stringify(config, null, 2));
		return;
	}

	console.log(bold("\n⚙️  Configuration\n"));
	console.log(dim(`  File: ${CONFIG_PATH}\n`));

	// Flatten config for display
	const flatConfig: Record<string, string> = {
		default_account: config.default_account,
		rpc_url: config.rpc_url,
		confirmations: config.confirmations.toString(),
		output_format: config.output_format,
		"notifications.discord_webhook":
			config.notifications.discord_webhook || "(not set)",
		"notifications.telegram_bot":
			config.notifications.telegram_bot || "(not set)",
		"trading.default_leverage": config.trading.default_leverage.toString(),
		"trading.max_slippage": `${config.trading.max_slippage}%`,
		"trading.auto_approve": config.trading.auto_approve.toString(),
	};

	console.log(keyValue(flatConfig, 2));
	console.log();
	console.log(
		dim("  Use 'deepdex config set <key> <value>' to modify settings."),
	);
	console.log();
}

/**
 * Set a configuration value
 */
export async function set(args: ParsedArgs): Promise<void> {
	const key = requireArg(args.positional, 0, "key");
	const value = requireArg(args.positional, 1, "value");

	// Validate key
	if (!isValidConfigKey(key)) {
		console.log(error(`Invalid configuration key: ${key}`));
		console.log();
		console.log(dim("Valid keys:"));
		for (const validKey of getValidConfigKeys()) {
			console.log(dim(`  ${validKey}`));
		}
		console.log();
		throw new Error("Invalid configuration key");
	}

	// Parse and validate value
	let parsedValue: unknown;
	try {
		parsedValue = parseConfigValue(key, value);
	} catch (err) {
		if (err instanceof Error) {
			throw new Error(`Invalid value for ${key}: ${err.message}`);
		}
		throw err;
	}

	// Get current value for comparison
	const currentValue = getConfigValue(key);

	if (args.flags.verbose) {
		console.log(dim(`  Current: ${JSON.stringify(currentValue)}`));
		console.log(dim(`  New:     ${JSON.stringify(parsedValue)}`));
	}

	// Set the value
	setConfigValue(key, parsedValue);

	console.log(success(`Configuration updated: ${key} = ${value}`));
	console.log();
}

/**
 * Reset configuration to defaults
 */
export async function reset(args: ParsedArgs): Promise<void> {
	console.log();
	console.log(warning("⚠️  This will reset ALL configuration to defaults."));

	if (!args.flags.yes) {
		const confirmed = await confirm("Are you sure?", false);
		if (!confirmed) {
			console.log(info("Reset cancelled."));
			return;
		}
	}

	resetConfig();
	console.log(success("Configuration reset to defaults."));
	console.log();
}
