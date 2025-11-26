#!/usr/bin/env bun
/**
 * DeepDex CLI - High-performance trading bot for DeepDex protocol
 *
 * @example
 * ```bash
 * # Initialize wallet
 * deepdex init
 *
 * # Start trading
 * deepdex spot buy ETH/USDC 1.0
 * deepdex perp long ETH-USDC 1.0 --lev 10
 *
 * # Run automated bot
 * deepdex bot start grid
 * ```
 */

import { parseArgs, route } from "./src/cli/index.ts";
import { VERSION } from "./src/utils/constants.ts";
import { error } from "./src/utils/format.ts";

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
	// Get command line arguments (skip "bun" and script path)
	const args = process.argv.slice(2);

	// Handle version flag
	if (args.includes("--version") || args.includes("-V")) {
		console.log(`deepdex v${VERSION}`);
		return;
	}

	// Parse and route
	const parsed = parseArgs(args);
	await route(parsed);
}

// Run the CLI
main().catch((err) => {
	if (err instanceof Error) {
		console.error(error(err.message));
		if (process.env.DEBUG) {
			console.error(err.stack);
		}
	} else {
		console.error(error(String(err)));
	}
	process.exit(1);
});
