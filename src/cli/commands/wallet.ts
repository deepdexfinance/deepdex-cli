/**
 * Wallet commands for DeepDex CLI
 */

import { getBalance, getNonce } from "../../services/client.ts";
import {
	getPrivateKey,
	getStoredAddress,
	getWalletCreatedAt,
	importWallet,
	isUnlocked,
	signMessage,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import {
	bold,
	dim,
	formatAmount,
	formatDate,
	success,
	warning,
} from "../../utils/format.ts";
import { confirm, keyValue, prompt, promptPassword } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { requireArg } from "../parser.ts";

/**
 * Display wallet information
 */
export async function info(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;
	const createdAt = getWalletCreatedAt();

	// Fetch on-chain data
	const [balance, nonce] = await Promise.all([
		getBalance(address),
		getNonce(address),
	]);

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					address,
					balance: balance.toString(),
					balanceFormatted: formatAmount(balance, 18),
					nonce,
					createdAt,
				},
				null,
				2,
			),
		);
		return;
	}

	console.log(bold("\n💼 Wallet Information\n"));

	const data: Record<string, string> = {
		Address: address,
		Balance: `${formatAmount(balance, 18)} ETH`,
		Nonce: nonce.toString(),
	};

	if (createdAt) {
		data.Created = formatDate(Math.floor(createdAt / 1000));
	}

	console.log(keyValue(data, 2));

	if (balance === 0n) {
		console.log();
		console.log(warning("Wallet has no ETH for gas fees."));
		console.log(dim("  Use 'deepdex faucet --token ETH' to get testnet ETH."));
	}

	console.log();
}

/**
 * Export private key (with confirmation)
 */
export async function exportKey(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	console.log();
	console.log(warning("⚠️  WARNING: This will display your private key."));
	console.log(dim("  Anyone with access to this key can steal your funds."));
	console.log(dim("  Make sure no one is watching your screen."));
	console.log();

	// Require explicit confirmation
	if (!args.flags.yes) {
		const confirmation = await prompt('Type "EXPORT" to confirm: ');
		if (confirmation !== "EXPORT") {
			console.log(info("Export cancelled."));
			return;
		}
	}

	// Unlock wallet if needed
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	const privateKey = getPrivateKey();

	console.log();
	console.log(bold("Private Key:"));
	console.log(`  ${privateKey}`);
	console.log();
	console.log(warning("Store this securely and never share it!"));
	console.log();
}

/**
 * Import wallet from private key
 */
export async function importKey(args: ParsedArgs): Promise<void> {
	const privateKey = requireArg(args.positional, 0, "private_key");

	// Validate format
	if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
		throw new Error(
			"Invalid private key format. Expected 0x followed by 64 hex characters.",
		);
	}

	// Check for existing wallet
	if (walletExists()) {
		const existingAddress = getStoredAddress();
		console.log(warning(`A wallet already exists: ${existingAddress}`));

		if (!args.flags.yes) {
			const confirmed = await confirm("Replace existing wallet?", false);
			if (!confirmed) {
				console.log(info("Import cancelled."));
				return;
			}
		}
	}

	// Get password
	const password = await promptPassword(
		"Create a password to encrypt your wallet: ",
	);
	const confirmPwd = await promptPassword("Confirm password: ");

	if (password !== confirmPwd) {
		throw new Error("Passwords do not match");
	}

	if (password.length < 8) {
		throw new Error("Password must be at least 8 characters");
	}

	const address = await importWallet(privateKey, password);

	console.log();
	console.log(success("Wallet imported successfully!"));
	console.log(`  Address: ${address}`);
	console.log();
}

/**
 * Sign an arbitrary message
 */
export async function sign(args: ParsedArgs): Promise<void> {
	const message = requireArg(args.positional, 0, "message");

	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	// Unlock wallet if needed
	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	const signature = await signMessage(message);

	if (args.flags.json) {
		console.log(JSON.stringify({ message, signature }, null, 2));
		return;
	}

	console.log();
	console.log(bold("Message Signature"));
	console.log();
	console.log(dim("Message:"));
	console.log(`  ${message}`);
	console.log();
	console.log(dim("Signature:"));
	console.log(`  ${signature}`);
	console.log();
}
