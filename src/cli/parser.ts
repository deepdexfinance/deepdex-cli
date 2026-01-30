/**
 * CLI argument parser for DeepDex
 */

import type { GlobalFlags } from "../types/index.ts";

export interface ParsedArgs {
	command: string[];
	flags: GlobalFlags;
	positional: string[];
	raw: Record<string, string | boolean | number>;
}

/**
 * Parse command line arguments
 */
export function parseArgs(args: string[]): ParsedArgs {
	const result: ParsedArgs = {
		command: [],
		flags: {},
		positional: [],
		raw: {},
	};

	let i = 0;
	let foundCommand = false;

	while (i < args.length) {
		const arg = args[i]!;

		// Handle flags
		if (arg.startsWith("--")) {
			const key = arg.slice(2);
			const nextArg = args[i + 1];

			// Check for boolean flags
			if (
				key === "json" ||
				key === "yes" ||
				key === "verbose" ||
				key === "dry-run" ||
				key === "post-only" ||
				key === "reduce-only" ||
				key === "help" ||
				key === "daemon" ||
				key === "follow" ||
				key === "watch" ||
				key === "quiet"
			) {
				result.raw[key] = true;
				mapGlobalFlag(result.flags, key, true);
			} else if (nextArg && !nextArg.startsWith("-")) {
				// Flag with value
				result.raw[key] = parseValue(nextArg);
				mapGlobalFlag(result.flags, key, nextArg);
				i++;
			} else {
				// Flag without value (boolean)
				result.raw[key] = true;
			}
		}
		// Handle short flags
		else if (arg.startsWith("-") && arg.length === 2) {
			const key = arg.slice(1);
			const nextArg = args[i + 1];

			// Map short flags
			const longKey = SHORT_FLAGS[key];
			if (longKey) {
				if (longKey === "yes" || longKey === "verbose" || longKey === "help") {
					result.raw[longKey] = true;
					mapGlobalFlag(result.flags, longKey, true);
				} else if (nextArg && !nextArg.startsWith("-")) {
					result.raw[longKey] = parseValue(nextArg);
					mapGlobalFlag(result.flags, longKey, nextArg);
					i++;
				}
			}
		}
		// Handle positional arguments
		else {
			if (!foundCommand) {
				// First positional args are the command path
				result.command.push(arg);
				// Check if this could be a sub-command
				if (!isSubCommand(arg)) {
					foundCommand = true;
				}
			} else {
				result.positional.push(arg);
			}
		}

		i++;
	}

	// Finalize command path (handle sub-commands)
	if (result.command.length > 1 && result.positional.length > 0) {
		// Check if second element should be a sub-command
		const maybeSubCmd = result.positional[0];
		if (maybeSubCmd && isSubCommandOf(result.command[0]!, maybeSubCmd)) {
			result.command.push(result.positional.shift()!);
		}
	}

	return result;
}

/**
 * Map parsed values to global flags
 */
function mapGlobalFlag(
	flags: GlobalFlags,
	key: string,
	value: string | boolean,
): void {
	switch (key) {
		case "account":
		case "a":
			flags.account = String(value);
			break;
		case "json":
			flags.json = true;
			break;
		case "yes":
		case "y":
			flags.yes = true;
			break;
		case "verbose":
		case "v":
			flags.verbose = true;
			break;
		case "dry-run":
			flags.dryRun = true;
			break;
	}
}

/**
 * Parse value to appropriate type
 */
function parseValue(value: string): string | number | boolean {
	// Boolean
	if (value === "true") return true;
	if (value === "false") return false;

	// Number
	const num = Number(value);
	if (!Number.isNaN(num) && value.trim() !== "") {
		return num;
	}

	return value;
}

/**
 * Short flag mappings
 */
const SHORT_FLAGS: Record<string, string> = {
	a: "account",
	c: "config",
	y: "yes",
	v: "verbose",
	h: "help",
};

/**
 * Commands that have sub-commands
 */
const PARENT_COMMANDS = [
	"wallet",
	"account",
	"market",
	"spot",
	"perp",
	"order",
	"position",
	"bot",
	"pm",
	"config",
	"history",
	"bridge",
];

/**
 * Check if a word is a potential sub-command starter
 */
function isSubCommand(word: string): boolean {
	return PARENT_COMMANDS.includes(word);
}

/**
 * Check if subCmd is a valid sub-command of parent
 */
function isSubCommandOf(parent: string, subCmd: string): boolean {
	const subCommands: Record<string, string[]> = {
		wallet: [
			"info",
			"export",
			"import",
			"sign",
			"list",
			"create",
			"switch",
			"rename",
			"delete",
			"transfer",
		],
		account: ["create", "list", "info", "deposit", "withdraw", "delegate"],
		market: ["list", "info", "orderbook", "trades", "price", "funding"],
		spot: ["buy", "sell"],
		perp: ["long", "short"],
		order: ["list", "cancel", "cancel-all", "history"],
		position: ["list", "info", "close", "modify"],
		bot: ["start", "stop", "status", "logs", "list-strategies", "backtest"],
		pm: ["ps", "start", "stop", "restart", "logs", "kill", "stop-all", "list"],
		config: ["show", "set", "reset", "export", "import"],
		history: ["trades", "transfers"],
		bridge: ["chains", "fees", "deposit", "withdraw", "status"],
	};

	return subCommands[parent]?.includes(subCmd) ?? false;
}

/**
 * Get flag value with type coercion
 */
export function getFlag<T extends string | number | boolean>(
	raw: Record<string, string | boolean | number>,
	key: string,
	defaultValue?: T,
): T | undefined {
	const value = raw[key];
	if (value === undefined) return defaultValue;
	return value as T;
}

/**
 * Require a positional argument
 */
export function requireArg(
	args: string[],
	index: number,
	name: string,
): string {
	const value = args[index];
	if (!value) {
		throw new Error(`Missing required argument: <${name}>`);
	}
	return value;
}

/**
 * Get optional positional argument
 */
export function optionalArg(
	args: string[],
	index: number,
	defaultValue?: string,
): string | undefined {
	return args[index] ?? defaultValue;
}
