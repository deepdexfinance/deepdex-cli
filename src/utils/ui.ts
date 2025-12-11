/**
 * CLI UI utilities for DeepDex - powered by consola
 */

import * as readline from "node:readline";
import { consola, createConsola } from "consola";
import {
	ENV_NON_INTERACTIVE,
	ENV_WALLET_PASSWORD,
	SYMBOLS,
} from "./constants.ts";
import { bold, dim } from "./format.ts";

// Create a custom consola instance for DeepDex
export const logger = createConsola({
	formatOptions: {
		colors: true,
		compact: false,
		date: false,
	},
});

// ============================================================================
// Table Rendering
// ============================================================================

export interface TableColumn {
	header: string;
	key: string;
	align?: "left" | "right" | "center";
	width?: number;
}

/**
 * Render a table to the console
 */
export function table(
	columns: TableColumn[],
	data: Record<string, string>[],
): string {
	if (data.length === 0) {
		return dim("No data to display");
	}

	// Calculate column widths
	const widths = columns.map((col) => {
		const headerLen = stripAnsi(col.header).length;
		const maxDataLen = Math.max(
			...data.map((row) => stripAnsi(row[col.key] || "").length),
		);
		return col.width || Math.max(headerLen, maxDataLen, 4);
	});

	// Build table
	const lines: string[] = [];

	// Top border
	lines.push(
		SYMBOLS.corner.tl +
		widths
			.map((w) => SYMBOLS.border.h.repeat(w + 2))
			.join(SYMBOLS.border.tee.t) +
		SYMBOLS.corner.tr,
	);

	// Header row
	const headerCells = columns.map((col, i) =>
		padCell(bold(col.header), widths[i]!, col.align || "left"),
	);
	lines.push(
		SYMBOLS.border.v +
		headerCells.map((c) => ` ${c} `).join(SYMBOLS.border.v) +
		SYMBOLS.border.v,
	);

	// Header separator
	lines.push(
		SYMBOLS.border.tee.l +
		widths
			.map((w) => SYMBOLS.border.h.repeat(w + 2))
			.join(SYMBOLS.border.cross) +
		SYMBOLS.border.tee.r,
	);

	// Data rows
	for (const row of data) {
		const cells = columns.map((col, i) =>
			padCell(row[col.key] || "", widths[i]!, col.align || "left"),
		);
		lines.push(
			SYMBOLS.border.v +
			cells.map((c) => ` ${c} `).join(SYMBOLS.border.v) +
			SYMBOLS.border.v,
		);
	}

	// Bottom border
	lines.push(
		SYMBOLS.corner.bl +
		widths
			.map((w) => SYMBOLS.border.h.repeat(w + 2))
			.join(SYMBOLS.border.tee.b) +
		SYMBOLS.corner.br,
	);

	return lines.join("\n");
}

/**
 * Render a simple key-value list
 */
export function keyValue(data: Record<string, string>, indent = 0): string {
	const maxKeyLen = Math.max(...Object.keys(data).map((k) => k.length));
	const prefix = " ".repeat(indent);

	return Object.entries(data)
		.map(([key, value]) => {
			const paddedKey = key.padEnd(maxKeyLen);
			return `${prefix}${dim(paddedKey)}  ${value}`;
		})
		.join("\n");
}

/**
 * Render a box around content
 */
export function box(title: string, content: string, width = 60): string {
	const lines: string[] = [];
	const innerWidth = width - 4;

	// Border color: #c084fc (purple)
	const borderColor = "\x1b[38;2;192;132;252m";
	const reset = "\x1b[0m";

	// Top border with title
	const titlePadded = ` ${title} `;
	const leftBorder = SYMBOLS.border.h.repeat(
		Math.floor((innerWidth - titlePadded.length) / 2),
	);
	const rightBorder = SYMBOLS.border.h.repeat(
		innerWidth - leftBorder.length - titlePadded.length,
	);

	lines.push(
		borderColor +
		SYMBOLS.corner.tl +
		leftBorder +
		reset +
		bold(titlePadded) +
		borderColor +
		rightBorder +
		SYMBOLS.corner.tr +
		reset,
	);

	// Content
	const contentLines = content.split("\n");
	for (const line of contentLines) {
		const stripped = stripAnsi(line);
		const padding = innerWidth - stripped.length;
		lines.push(
			`${borderColor}${SYMBOLS.border.v}${reset} ${line}${" ".repeat(Math.max(0, padding))} ${borderColor}${SYMBOLS.border.v}${reset}`,
		);
	}

	// Bottom border
	lines.push(
		borderColor +
		SYMBOLS.corner.bl +
		SYMBOLS.border.h.repeat(innerWidth + 2) +
		SYMBOLS.corner.br +
		reset,
	);

	return lines.join("\n");
}

// ============================================================================
// User Input
// ============================================================================

/**
 * Ask for confirmation
 */
export async function confirm(
	message: string,
	defaultValue = false,
): Promise<boolean> {
	const suffix = defaultValue ? "[Y/n]" : "[y/N]";
	const answer = await prompt(`${message} ${dim(suffix)} `);

	if (!answer) return defaultValue;
	return answer.toLowerCase().startsWith("y");
}

/**
 * Ask for text input
 */
export async function prompt(message: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(message, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

/**
 * Ask for password input (hidden)
 */
export async function promptPassword(message: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		// Hide input
		const stdin = process.stdin;
		const onData = (char: Buffer) => {
			const c = char.toString("utf8");
			if (c === "\n" || c === "\r" || c === "\u0004") {
				stdin.removeListener("data", onData);
			} else if (process.stdout.isTTY) {
				process.stdout.clearLine?.(0);
				process.stdout.cursorTo?.(0);
				process.stdout.write(message + "*".repeat(rl.line.length + 1));
			}
		};

		if (process.stdin.isTTY) {
			stdin.on("data", onData);
		}

		rl.question(message, (answer) => {
			rl.close();
			console.log(); // New line after hidden input
			resolve(answer);
		});
	});
}

/**
 * Options for getPassword function
 */
export interface GetPasswordOptions {
	/** Custom prompt message */
	message?: string;
	/** Password from --password flag (takes priority over env) */
	flagPassword?: string;
	/** Allow reading from environment variable */
	allowEnv?: boolean;
	/** Custom env var name (defaults to DEEPDEX_WALLET_PASSWORD) */
	envVarName?: string;
}

/**
 * Check if running in non-interactive mode
 */
export function isNonInteractive(): boolean {
	const envValue = process.env[ENV_NON_INTERACTIVE];
	return envValue === "true" || envValue === "1";
}

/**
 * Get password with priority fallback:
 * 1. --password flag (if provided)
 * 2. Environment variable (if allowEnv is true)
 * 3. Interactive prompt (if not in non-interactive mode)
 *
 * @throws Error if non-interactive mode and no password source available
 *
 * @example
 * // Basic usage - prompts if needed
 * const password = await getPassword();
 *
 * @example
 * // With flag from CLI
 * const password = await getPassword({ flagPassword: args.flags.password });
 *
 * @example
 * // For automation (bot scripts)
 * const password = await getPassword({ allowEnv: true });
 */
export async function getPassword(
	options: GetPasswordOptions = {},
): Promise<string> {
	const {
		message = "Enter wallet password: ",
		flagPassword,
		allowEnv = true,
		envVarName = ENV_WALLET_PASSWORD,
	} = options;

	// Priority 1: --password flag
	if (flagPassword && flagPassword.length > 0) {
		return flagPassword;
	}

	// Priority 2: Environment variable
	if (allowEnv) {
		const envPassword = process.env[envVarName];
		if (envPassword && envPassword.length > 0) {
			// Log that we're using env password (but don't show it)
			consola.info(
				dim(`Using password from ${envVarName} environment variable`),
			);
			return envPassword;
		}
	}

	// Priority 3: Interactive prompt
	if (isNonInteractive()) {
		throw new Error(
			`Password required but running in non-interactive mode. ` +
			`Set ${envVarName} environment variable or provide --password flag.`,
		);
	}

	return promptPassword(message);
}

/**
 * Options for getNewPassword function
 */
export interface GetNewPasswordOptions {
	/** Custom prompt message */
	message?: string;
	/** Password from --password flag (takes priority over env). Can be number if parsed from CLI. */
	flagPassword?: string | number;
	/** Allow reading from environment variable */
	allowEnv?: boolean;
	/** Custom env var name (defaults to DEEPDEX_NEW_WALLET_PASSWORD) */
	envVarName?: string;
}

/** Default env var name for new wallet password */
const ENV_NEW_WALLET_PASSWORD = "DEEPDEX_NEW_WALLET_PASSWORD";

/**
 * Get password for wallet creation/import (with confirmation)
 * This is only for creating new wallets, not unlocking.
 *
 * Priority:
 * 1. --password flag (if provided)
 * 2. Environment variable (if allowEnv is true)
 * 3. Interactive prompt with confirmation (if not in non-interactive mode)
 *
 * @throws Error if non-interactive mode and no password source available
 *
 * @example
 * // Basic usage - prompts if needed
 * const password = await getNewPassword();
 *
 * @example
 * // With flag from CLI
 * const password = await getNewPassword({ flagPassword: args.flags.password });
 *
 * @example
 * // For automation (scripts)
 * // Set DEEPDEX_NEW_WALLET_PASSWORD=mypassword
 * const password = await getNewPassword({ allowEnv: true });
 */
export async function getNewPassword(
	options: GetNewPasswordOptions = {},
): Promise<string> {
	const {
		message = "Create a password: ",
		flagPassword,
		allowEnv = true,
		envVarName = ENV_NEW_WALLET_PASSWORD,
	} = options;

	// Priority 1: --password flag
	if (flagPassword !== undefined && flagPassword !== null) {
		const passwordStr = String(flagPassword);
		if (passwordStr.length > 0) {
			if (passwordStr.length < 8) {
				throw new Error("Password must be at least 8 characters.");
			}
			consola.info(dim("Using password from --password flag"));
			return passwordStr;
		}
	}

	// Priority 2: Environment variable
	if (allowEnv) {
		const envPassword = process.env[envVarName];
		if (envPassword && envPassword.length > 0) {
			if (envPassword.length < 8) {
				throw new Error("Password must be at least 8 characters.");
			}
			consola.info(
				dim(`Using password from ${envVarName} environment variable`),
			);
			return envPassword;
		}
	}

	// Priority 3: Interactive prompt with confirmation
	if (isNonInteractive()) {
		throw new Error(
			`Password required for wallet creation but running in non-interactive mode. ` +
			`Set ${envVarName} environment variable or provide --password flag.`,
		);
	}

	const password = await promptPassword(message);
	const confirmPwd = await promptPassword("Confirm password: ");

	if (password !== confirmPwd) {
		throw new Error("Passwords do not match.");
	}

	if (password.length < 8) {
		throw new Error("Password must be at least 8 characters.");
	}

	return password;
}

/**
 * Show a selection menu
 */
export async function select(
	message: string,
	options: { value: string; label: string }[],
): Promise<string> {
	console.log(message);
	options.forEach((opt, i) => {
		console.log(`  ${dim(`${i + 1}.`)} ${opt.label}`);
	});

	const answer = await prompt(`\nEnter choice (1-${options.length}): `);
	const index = Number.parseInt(answer, 10) - 1;

	if (index >= 0 && index < options.length) {
		return options[index]!.value;
	}

	throw new Error("Invalid selection");
}

/**
 * Ask for file path input with tab-completion
 */
export async function promptPath(
	message: string,
	options?: {
		defaultValue?: string;
		extensions?: string[];
		baseDir?: string;
	},
): Promise<string> {
	const { readdirSync, statSync } = await import("node:fs");
	const { resolve, dirname, basename, join } = await import("node:path");

	const baseDir = options?.baseDir || process.cwd();
	const extensions = options?.extensions || [".json"];

	// Completer function for tab completion
	const completer = (line: string): [string[], string] => {
		try {
			// Resolve the path relative to baseDir
			const inputPath = line || "./";
			const fullPath = resolve(baseDir, inputPath);

			let searchDir: string;
			let partial: string;

			try {
				const stat = statSync(fullPath);
				if (stat.isDirectory()) {
					searchDir = fullPath;
					partial = "";
				} else {
					searchDir = dirname(fullPath);
					partial = basename(fullPath);
				}
			} catch {
				searchDir = dirname(fullPath);
				partial = basename(fullPath);
			}

			// Read directory contents
			let entries: string[] = [];
			try {
				entries = readdirSync(searchDir);
			} catch {
				return [[], line];
			}

			// Filter entries
			const matches = entries
				.filter((entry) => {
					if (!entry.startsWith(partial)) return false;

					const entryPath = join(searchDir, entry);
					try {
						const entryStat = statSync(entryPath);
						if (entryStat.isDirectory()) return true;
						// Filter by extension
						return extensions.some((ext) => entry.endsWith(ext));
					} catch {
						return false;
					}
				})
				.map((entry) => {
					const entryPath = join(searchDir, entry);
					try {
						const entryStat = statSync(entryPath);
						// Build the completion string
						const dirPart = inputPath.includes("/")
							? inputPath.substring(0, inputPath.lastIndexOf("/") + 1)
							: inputPath.startsWith(".")
								? ""
								: "./";
						const suffix = entryStat.isDirectory() ? "/" : "";
						return dirPart + entry + suffix;
					} catch {
						return entry;
					}
				});

			return [matches, line];
		} catch {
			return [[], line];
		}
	};

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		completer,
	});

	// Show hint
	console.log(dim("  (Use Tab for path completion)"));

	return new Promise((resolve) => {
		rl.question(message, (answer) => {
			rl.close();
			const result = answer.trim() || options?.defaultValue || "";
			resolve(result);
		});
	});
}

// ============================================================================
// Progress & Spinners (using consola)
// ============================================================================

/**
 * Create a spinner for loading states using consola
 */
export function spinner(message: string) {
	let isRunning = false;

	return {
		start() {
			isRunning = true;
			consola.start(message);
		},
		stop(finalMessage?: string) {
			if (isRunning) {
				isRunning = false;
				if (finalMessage) {
					// Use stripAnsi to clean the message
					const cleanMessage = stripAnsi(finalMessage);
					// Parse the message to determine type
					if (cleanMessage.includes("✓") || cleanMessage.includes("success")) {
						consola.success(cleanMessage.replace(/^.*?✓\s*/, ""));
					} else if (
						cleanMessage.includes("✗") ||
						cleanMessage.includes("error")
					) {
						consola.error(cleanMessage.replace(/^.*?✗\s*/, ""));
					} else if (cleanMessage.trim()) {
						consola.info(cleanMessage);
					}
				}
			}
		},
		update(newMessage: string) {
			if (isRunning) {
				consola.start(newMessage);
			}
		},
	};
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Strip ANSI codes from string
 */
export function stripAnsi(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Need to match ANSI escape codes
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		"",
	);
}

/**
 * Pad cell content
 */
function padCell(
	content: string,
	width: number,
	align: "left" | "right" | "center",
): string {
	const stripped = stripAnsi(content);
	const padding = Math.max(0, width - stripped.length);

	switch (align) {
		case "right":
			return " ".repeat(padding) + content;
		case "center": {
			const left = Math.floor(padding / 2);
			const right = padding - left;
			return " ".repeat(left) + content + " ".repeat(right);
		}
		default:
			return content + " ".repeat(padding);
	}
}

/**
 * Print a horizontal divider
 */
export function divider(width = 60): string {
	return dim(SYMBOLS.border.h.repeat(width));
}
