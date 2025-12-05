/**
 * Wallet commands - Multi-wallet management for DeepDex
 */

import { consola } from "consola";
import { type Address, isAddress, parseUnits } from "viem";
import { network } from "../../abis/config.ts";
import {
	getBalance,
	getNonce,
	getTokenBalance,
	transferNative,
	transferToken,
	waitForTransaction,
} from "../../services/client.ts";
import {
	createWallet,
	deleteWallet,
	exportPrivateKey,
	getActiveWalletName,
	getAllWallets,
	getStoredAddress,
	getWalletCount,
	importWallet,
	renameWallet,
	signMessage,
	switchWallet,
	unlockWallet,
	walletExists,
	walletNameExists,
} from "../../services/wallet.ts";
import { dim, formatAmount, truncateAddress } from "../../utils/format.ts";
import { confirm, keyValue, prompt, promptPassword } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

/**
 * Display wallet info
 */
export async function info(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const walletName = args.positional[0] || getActiveWalletName();
	if (!walletName) {
		throw new Error("No active wallet found. Run 'deepdex init' first.");
	}
	const address = getStoredAddress(walletName)!;

	consola.start("Fetching wallet info...");

	const [balance, nonce] = await Promise.all([
		getBalance(address as `0x${string}`),
		getNonce(address as `0x${string}`),
	]);

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					name: walletName,
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
		message: `Wallet: ${walletName}`,
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
				Name: walletName,
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
 * List all wallets
 */
export async function list(args: ParsedArgs): Promise<void> {
	const wallets = getAllWallets();

	if (wallets.length === 0) {
		consola.info("No wallets found. Run 'deepdex init' to create one.");
		return;
	}

	if (args.flags.json) {
		console.log(JSON.stringify(wallets, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "💼 Wallets",
		message: `${wallets.length} wallet${wallets.length > 1 ? "s" : ""} found`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	for (const wallet of wallets) {
		const marker = wallet.isActive ? "→ " : "  ";
		const activeLabel = wallet.isActive ? dim(" (active)") : "";
		console.log(
			`${marker}${wallet.name}${activeLabel}\n    ${dim(wallet.address)}`,
		);
		console.log();
	}
}

/**
 * Create a new wallet
 */
export async function create(args: ParsedArgs): Promise<void> {
	const name = args.positional[0];

	if (name && walletNameExists(name)) {
		throw new Error(`Wallet "${name}" already exists.`);
	}

	console.log();
	consola.box({
		title: "🔐 Create Wallet",
		message: name ? `Creating wallet: ${name}` : "Creating new wallet",
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	const password = await promptPassword("Create a password: ");
	const confirmPwd = await promptPassword("Confirm password: ");

	if (password !== confirmPwd) {
		throw new Error("Passwords do not match.");
	}

	if (password.length < 8) {
		throw new Error("Password must be at least 8 characters.");
	}

	consola.start("Creating wallet...");
	const address = await createWallet(password, name);

	console.log();
	consola.success("Wallet created successfully!");
	console.log(`  Name:    ${name || "default"}`);
	console.log(`  Address: ${address}`);
	console.log();

	const count = getWalletCount();
	if (count > 1) {
		consola.info(
			`You now have ${count} wallets. Use 'deepdex wallet switch <name>' to switch.`,
		);
	}
}

/**
 * Switch active wallet
 */
export async function switchCmd(args: ParsedArgs): Promise<void> {
	const name = requireArg(args.positional, 0, "wallet_name");

	if (!walletNameExists(name)) {
		throw new Error(
			`Wallet "${name}" not found. Use 'deepdex wallet list' to see available wallets.`,
		);
	}

	switchWallet(name);
	consola.success(`Switched to wallet: ${name}`);
}

/**
 * Rename a wallet
 */
export async function rename(args: ParsedArgs): Promise<void> {
	const oldName = requireArg(args.positional, 0, "current_name");
	const newName = requireArg(args.positional, 1, "new_name");

	if (!walletNameExists(oldName)) {
		throw new Error(`Wallet "${oldName}" not found.`);
	}

	if (walletNameExists(newName)) {
		throw new Error(`Wallet "${newName}" already exists.`);
	}

	renameWallet(oldName, newName);
	consola.success(`Wallet renamed: ${oldName} → ${newName}`);
}

/**
 * Delete a wallet
 */
export async function remove(args: ParsedArgs): Promise<void> {
	const name = requireArg(args.positional, 0, "wallet_name");

	if (!walletNameExists(name)) {
		throw new Error(`Wallet "${name}" not found.`);
	}

	console.log();
	consola.box({
		title: "⚠️ Delete Wallet",
		message: `You are about to delete wallet: ${name}
This action cannot be undone.
Make sure you have backed up your private key.`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	console.log();

	const confirmed = await confirm(
		`Type "DELETE" to confirm deletion of wallet "${name}"`,
		false,
	);

	if (!confirmed) {
		consola.info("Cancelled.");
		return;
	}

	deleteWallet(name);
	consola.success(`Wallet "${name}" deleted.`);

	const count = getWalletCount();
	if (count > 0) {
		const active = getActiveWalletName();
		consola.info(`Active wallet is now: ${active}`);
	} else {
		consola.warn("No wallets remaining. Run 'deepdex init' to create one.");
	}
}

/**
 * Export private key
 */
export async function exportKey(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const walletName = args.positional[0] || getActiveWalletName();

	console.log();
	consola.box({
		title: "⚠️ Export Private Key",
		message: `WARNING: Your private key provides full access to your wallet.
Never share it with anyone. Never paste it into websites.
Store it securely offline.

Exporting key for wallet: ${walletName}`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	console.log();

	const confirmed = await confirm(
		"I understand the risks. Export my private key.",
		false,
	);
	if (!confirmed) {
		consola.info("Cancelled.");
		return;
	}

	const password = await promptPassword("Enter wallet password: ");
	const privateKey = await exportPrivateKey(password, walletName || undefined);

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
	const name = args.positional[1] || getFlag<string>(args.raw, "name");

	if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
		throw new Error(
			"Invalid private key format. Expected 0x followed by 64 hex characters.",
		);
	}

	if (name && walletNameExists(name)) {
		throw new Error(`Wallet "${name}" already exists.`);
	}

	console.log();
	consola.box({
		title: "🔐 Import Wallet",
		message: name
			? `Importing wallet as: ${name}`
			: "Import your wallet from a private key",
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	const password = await promptPassword("Create a password: ");
	const confirmPwd = await promptPassword("Confirm password: ");

	if (password !== confirmPwd) {
		throw new Error("Passwords do not match.");
	}

	if (password.length < 8) {
		throw new Error("Password must be at least 8 characters.");
	}

	consola.start("Importing wallet...");
	const address = await importWallet(privateKey, password, name);

	console.log();
	consola.success("Wallet imported successfully!");
	console.log(`  Name:    ${name || getActiveWalletName()}`);
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

	const walletName =
		getFlag<string>(args.raw, "wallet") || getActiveWalletName();

	const password = await promptPassword("Enter wallet password: ");
	await unlockWallet(password, walletName || undefined);

	consola.start("Signing message...");
	const signature = await signMessage(message);

	if (args.flags.json) {
		console.log(
			JSON.stringify({ wallet: walletName, message, signature }, null, 2),
		);
		return;
	}

	console.log();
	consola.success("Message signed:");
	console.log();
	console.log(`  Wallet:    ${walletName}`);
	console.log(`  Message:   ${dim(message)}`);
	console.log(`  Signature: ${signature}`);
	console.log();
}

// ============================================================================
// Token Configuration
// ============================================================================

type TokenInfo = {
	symbol: string;
	address: Address;
	decimals: number;
};

function getTokenInfo(tokenSymbol: string): TokenInfo | null {
	const symbol = tokenSymbol.toUpperCase();

	if (symbol === "TDGAS" || symbol === "DGAS") {
		return {
			symbol: "tDGAS",
			address: network.tokens.tDGAS.address as Address,
			decimals: network.tokens.tDGAS.decimals,
		};
	}

	if (symbol === "USDC") {
		return {
			symbol: "USDC",
			address: network.tokens.usdc.address as Address,
			decimals: network.tokens.usdc.decimals,
		};
	}

	if (symbol === "ETH") {
		return {
			symbol: "ETH",
			address: network.tokens.eth.address as Address,
			decimals: network.tokens.eth.decimals,
		};
	}

	return null;
}

/**
 * Transfer tokens to another wallet or address
 */
export async function transfer(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const amountStr = requireArg(args.positional, 0, "amount");
	const tokenSymbol = requireArg(args.positional, 1, "token");
	let toAddress = args.positional[2] || getFlag<string>(args.raw, "to");

	const tokenInfo = getTokenInfo(tokenSymbol);
	if (!tokenInfo) {
		throw new Error(
			`Unknown token: ${tokenSymbol}. Supported tokens: tDGAS, USDC, ETH`,
		);
	}

	const isNative =
		tokenInfo.address === "0x0000000000000000000000000000000000000000";

	// Check if recipient is a wallet name or address
	if (toAddress) {
		if (walletNameExists(toAddress)) {
			const walletAddress = getStoredAddress(toAddress);
			if (!walletAddress) {
				throw new Error(`Could not get address for wallet: ${toAddress}`);
			}
			toAddress = walletAddress;
		} else if (!isAddress(toAddress)) {
			throw new Error(
				`Invalid address or wallet name: ${toAddress}. Provide a valid address or existing wallet name.`,
			);
		}
	} else {
		// Interactive mode: prompt for recipient
		const wallets = getAllWallets();
		const activeWallet = getActiveWalletName();

		console.log();
		consola.info("Available wallets:");
		for (const w of wallets) {
			if (w.name !== activeWallet) {
				console.log(
					`  ${w.name}: ${dim(truncateAddress(w.address as Address))}`,
				);
			}
		}
		console.log();

		const recipient = await prompt(
			"Enter recipient (wallet name or address): ",
		);
		if (!recipient) {
			throw new Error("Recipient is required.");
		}

		if (walletNameExists(recipient)) {
			const walletAddress = getStoredAddress(recipient);
			if (!walletAddress) {
				throw new Error(`Could not get address for wallet: ${recipient}`);
			}
			toAddress = walletAddress;
		} else if (isAddress(recipient)) {
			toAddress = recipient;
		} else {
			throw new Error(`Invalid address or wallet name: ${recipient}`);
		}
	}

	const amount = parseUnits(amountStr, tokenInfo.decimals);
	const walletName = getActiveWalletName();
	const fromAddress = getStoredAddress()!;

	// Check balance
	let balance: bigint;
	if (isNative) {
		balance = await getBalance(fromAddress as Address);
	} else {
		balance = await getTokenBalance(fromAddress as Address, tokenInfo.address);
	}

	if (balance < amount) {
		throw new Error(
			`Insufficient ${tokenInfo.symbol} balance. Have: ${formatAmount(balance, tokenInfo.decimals)}, Need: ${amountStr}`,
		);
	}

	console.log();
	consola.box({
		title: "💸 Transfer",
		message: `Transfer ${amountStr} ${tokenInfo.symbol}

From: ${walletName} (${truncateAddress(fromAddress as Address)})
To:   ${truncateAddress(toAddress as Address)}`,
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	const confirmed = await confirm("Confirm transfer?", true);
	if (!confirmed) {
		consola.info("Cancelled.");
		return;
	}

	const password = await promptPassword("Enter wallet password: ");
	await unlockWallet(password, walletName || undefined);

	consola.start("Sending transaction...");

	let hash: `0x${string}`;
	if (isNative) {
		hash = await transferNative(toAddress as Address, amount);
	} else {
		hash = await transferToken(tokenInfo.address, toAddress as Address, amount);
	}

	consola.start(`Transaction sent: ${truncateAddress(hash as Address)}`);
	consola.start("Waiting for confirmation...");

	const receipt = await waitForTransaction(hash);

	if (receipt.status === "success") {
		console.log();
		consola.success("Transfer completed!");
		console.log();
		console.log(
			keyValue(
				{
					Amount: `${amountStr} ${tokenInfo.symbol}`,
					To: toAddress,
					"Tx Hash": hash,
					Block: receipt.blockNumber.toString(),
					Explorer: `${network.explorer}/tx/${hash}`,
				},
				2,
			),
		);
		console.log();
	} else {
		throw new Error(`Transaction reverted. Hash: ${hash}`);
	}
}
