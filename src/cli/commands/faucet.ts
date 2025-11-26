/**
 * Faucet command - Mint testnet tokens
 */

import { network } from "../../abis/config.ts";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
import { bold, dim, info, success } from "../../utils/format.ts";
import { spinner } from "../../utils/ui.ts";
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
	const validTokens = ["USDC", "ETH", "SOL"];
	if (!validTokens.includes(token)) {
		throw new Error(
			`Invalid token: ${token}. Available: ${validTokens.join(", ")}`,
		);
	}

	console.log();
	console.log(bold("🚰 DeepDex Testnet Faucet\n"));

	const spin = spinner(`Requesting ${token} from faucet...`);
	spin.start();

	// Simulate faucet delay
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// In production, this would call the faucet contract or API
	// For now, we simulate the response

	const amounts: Record<string, string> = {
		USDC: "10,000",
		ETH: "1.0",
		SOL: "100",
	};

	spin.stop(success(`Received ${amounts[token]} ${token}!`));

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
	console.log(info("Tokens will appear in your wallet shortly."));

	if (token === "USDC") {
		console.log(dim("  Next step: deepdex account deposit 1000 USDC"));
	}
	console.log();
}
