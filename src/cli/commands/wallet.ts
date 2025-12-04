/**
 * Wallet commands - Wallet management for DeepDex
 */

import { consola } from "consola";
import { network } from "../../abis/config.ts";
import { getBalance, getNonce } from "../../services/client.ts";
import {
	exportPrivateKey,
	getStoredAddress,
	importWallet,
	signMessage,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { dim, formatAmount } from "../../utils/format.ts";
import { confirm, keyValue, prompt, promptPassword } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { requireArg } from "../parser.ts";

/**
 * Display wallet info
 */
export async function info(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;

	consola.start("Fetching wallet info...");

	const [balance, nonce] = await Promise.all([
		getBalance(address as `0x${string}`),
		getNonce(address as `0x${string}`),
	]);

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					address,
					balance: balance.toString(),
					nonce,
				},
				null,
				2,
			),
		);
		return;
	}

	console.log();
	consola.box({
		title: "💼 Wallet Info",
		message: "Your DeepDex wallet details",
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	console.log(
		keyValue(
			{
				Address: address,
				"tDGAS Balance": `${formatAmount(balance, 18, 6)} tDGAS`,
				Nonce: nonce.toString(),
				Explorer: `${network.explorer}/address/${address}`,
			},
			2,
		),
	);

	if (balance === 0n) {
		console.log();
		consola.warn(
			"No tDGAS for gas. Get some with: deepdex faucet --token tDGAS",
		);
	}

	console.log();
}

/**
 * Export private key
 */
export async function exportKey(_args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	console.log();
	consola.box({
		title: "⚠️ Export Private Key",
		message: `WARNING: Your private key provides full access to your wallet.
Never share it with anyone. Never paste it into websites.
Store it securely offline.`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	console.log();

	// Confirm
	const confirmed = await confirm(
		"I understand the risks. Export my private key.",
		false,
	);
	if (!confirmed) {
		consola.info("Cancelled.");
		return;
	}

	// Enter password
	const password = await promptPassword("Enter wallet password: ");
	const privateKey = await exportPrivateKey(password);

	console.log();
	consola.success("Private key exported:");
	console.log();
	console.log(`  ${privateKey}`);
	console.log();
	consola.warn(
		"Copy this key and store it securely. It will not be shown again.",
	);
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

	console.log();
	consola.box({
		title: "🔐 Import Wallet",
		message: "Import your wallet from a private key",
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	// Check for existing wallet
	if (walletExists()) {
		consola.warn("A wallet already exists.");
		const confirmed = await confirm(
			"Replace it with the imported wallet?",
			false,
		);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	// Set password
	const password = await promptPassword("Create a password: ");
	const confirmPwd = await promptPassword("Confirm password: ");

	if (password !== confirmPwd) {
		throw new Error("Passwords do not match.");
	}

	if (password.length < 8) {
		throw new Error("Password must be at least 8 characters.");
	}

	// Import
	consola.start("Importing wallet...");
	const address = await importWallet(privateKey, password);

	console.log();
	consola.success("Wallet imported successfully!");
	console.log(`  Address: ${address}`);
	console.log();
}

/**
 * Sign a message
 */
export async function sign(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	let message = args.positional[0];

	if (!message) {
		message = await prompt("Enter message to sign: ");
		if (!message) {
			throw new Error("Message is required.");
		}
	}

	// Unlock wallet
	const password = await promptPassword("Enter wallet password: ");
	await unlockWallet(password);

	// Sign
	consola.start("Signing message...");
	const signature = await signMessage(message);

	if (args.flags.json) {
		console.log(JSON.stringify({ message, signature }, null, 2));
		return;
	}

	console.log();
	consola.success("Message signed:");
	console.log();
	console.log(`  Message:   ${dim(message)}`);
	console.log(`  Signature: ${signature}`);
	console.log();
}
