/**
 * CLI UI utilities for DeepDex - powered by consola
 */

import * as readline from "node:readline";
import { consola, createConsola } from "consola";
import { SYMBOLS } from "./constants.ts";
import { bold, dim } from "./format.ts";

// Create a custom consola instance for DeepDex
export const logger = createConsola({
	fancy: true,
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

	// Top border with title
	const titlePadded = ` ${title} `;
	const leftBorder = SYMBOLS.border.h.repeat(
		Math.floor((innerWidth - titlePadded.length) / 2),
	);
	const rightBorder = SYMBOLS.border.h.repeat(
		innerWidth - leftBorder.length - titlePadded.length,
	);

	lines.push(
		SYMBOLS.corner.tl +
			leftBorder +
			bold(titlePadded) +
			rightBorder +
			SYMBOLS.corner.tr,
	);

	// Content
	const contentLines = content.split("\n");
	for (const line of contentLines) {
		const stripped = stripAnsi(line);
		const padding = innerWidth - stripped.length;
		lines.push(
			`${SYMBOLS.border.v} ${line}${" ".repeat(Math.max(0, padding))} ${SYMBOLS.border.v}`,
		);
	}

	// Bottom border
	lines.push(
		SYMBOLS.corner.bl +
			SYMBOLS.border.h.repeat(innerWidth + 2) +
			SYMBOLS.corner.br,
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
		return options[index]?.value;
	}

	throw new Error("Invalid selection");
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
