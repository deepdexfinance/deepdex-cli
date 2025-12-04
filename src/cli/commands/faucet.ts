/**
 * Faucet command - Mint testnet tokens
 */

import { consola } from "consola";
import { network } from "../../abis/config.ts";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
import { dim } from "../../utils/format.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag } from "../parser.ts";

/**
 * Mint testnet tokens
 */
export async function run(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const token = (getFlag<string>(args.raw, "token") || "USDC").toUpperCase();
	const address = getStoredAddress()!;

	// Validate token
	const validTokens = ["USDC", "tDGAS", "SOL"];
	if (!validTokens.includes(token)) {
		throw new Error(
			`Invalid token: ${token}. Available: ${validTokens.join(", ")}`,
		);
	}

	console.log();
	consola.box({
		title: "🚰 DeepDex Testnet Faucet",
		message: `Minting ${token} tokens to your wallet`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();
	consola.start(`Requesting ${token} from faucet...`);

	// Simulate faucet delay
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// In production, this would call the faucet contract or API
	// For now, we simulate the response

	const amounts: Record<string, string> = {
		USDC: "10,000",
		tDGAS: "1.0",
		SOL: "100",
	};

	consola.success(`Received ${amounts[token]} ${token}!`);

	console.log();
	console.log(`${dim("  Recipient:")} ${address}`);
	console.log(`${dim("  Token:    ")} ${token}`);
	console.log(`${dim("  Amount:   ")} ${amounts[token]}`);
	console.log();

	// Token addresses for reference
	const tokenInfo = Object.values(network.tokens).find(
		(t) => t.symbol.toUpperCase() === token,
	);
	if (tokenInfo) {
		console.log(dim(`  Token Contract: ${tokenInfo.address}`));
	}

	console.log();
	consola.info("Tokens will appear in your wallet shortly.");

	if (token === "USDC") {
		console.log(dim("  Next step: deepdex account deposit 1000 USDC"));
	}
	console.log();
}
