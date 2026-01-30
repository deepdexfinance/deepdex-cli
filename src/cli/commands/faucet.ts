/**
 * Faucet command - Request testnet tokens from the faucet API
 */

import { consola } from "consola";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
import { dim } from "../../utils/format.ts";
import type { ParsedArgs } from "../parser.ts";

const FAUCET_API_URL =
	"https://deepdex-web-production.up.railway.app/api/faucet";
const FAUCET_AUTH_TOKEN = "DgtZTmiRoSGQxDgyfojAMYfBeQjGtXkY";

/**
 * Request tokens from faucet API
 */
export async function run(_args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;

	console.log();
	consola.box({
		title: "🚰 DeepDex Testnet Faucet",
		message: "Requesting 1000 USDC from faucet API",
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();
	console.log(`${dim("  Address:")} ${address}`);
	console.log();
	consola.start("Requesting tokens from faucet...");

	try {
		const response = await fetch(FAUCET_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				address,
				authToken: FAUCET_AUTH_TOKEN,
			}),
		});

		const data = (await response.json()) as {
			error?: string;
			message?: string;
			txHash?: string;
			amount?: string;
		};

		if (!response.ok) {
			throw new Error(
				data.error ||
					data.message ||
					`Faucet request failed: ${response.status}`,
			);
		}

		consola.success("Faucet request successful!");
		console.log();

		if (data.txHash) {
			console.log(`${dim("  Transaction:")} ${data.txHash}`);
		}
		if (data.amount) {
			console.log(`${dim("  Amount:     ")} ${data.amount}`);
		}
		if (data.message) {
			console.log(`${dim("  Message:    ")} ${data.message}`);
		}

		console.log();
		consola.info("Tokens will appear in your wallet shortly.");
		console.log(dim("  Next step: deepdex account deposit <amount> USDC"));
		console.log();
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Faucet request failed: ${error.message}`);
		}
		throw error;
	}
}
