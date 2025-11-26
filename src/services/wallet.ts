/**
 * Wallet management service for DeepDex CLI
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import type { Address, Hex } from "viem";
import {
	type PrivateKeyAccount,
	privateKeyToAccount,
	generatePrivateKey as viemGeneratePrivateKey,
} from "viem/accounts";
import { ensureDirectories } from "../config/index.ts";
import type { StoredWallet } from "../types/index.ts";
import { WALLET_PATH } from "../utils/constants.ts";
import { decrypt, encrypt, isValidPrivateKey } from "../utils/crypto.ts";

// ============================================================================
// In-Memory Wallet State
// ============================================================================

let currentAccount: PrivateKeyAccount | null = null;
let currentPrivateKey: Hex | null = null;

// ============================================================================
// Wallet Storage
// ============================================================================

/**
 * Check if a wallet exists
 */
export function walletExists(): boolean {
	return existsSync(WALLET_PATH);
}

/**
 * Create a new wallet
 */
export async function createWallet(password: string): Promise<Address> {
	ensureDirectories();

	const privateKey = viemGeneratePrivateKey();
	const account = privateKeyToAccount(privateKey);

	// Encrypt and store
	const { encrypted, salt, iv } = await encrypt(privateKey, password);

	const stored: StoredWallet = {
		address: account.address,
		encrypted,
		salt,
		iv,
		createdAt: Date.now(),
	};

	writeFileSync(WALLET_PATH, JSON.stringify(stored, null, 2));

	// Set as current
	currentAccount = account;
	currentPrivateKey = privateKey;

	return account.address;
}

/**
 * Import a wallet from private key
 */
export async function importWallet(
	privateKey: string,
	password: string,
): Promise<Address> {
	ensureDirectories();

	// Normalize and validate
	const normalizedKey = privateKey.startsWith("0x")
		? privateKey
		: `0x${privateKey}`;

	if (!isValidPrivateKey(normalizedKey)) {
		throw new Error("Invalid private key format");
	}

	const account = privateKeyToAccount(normalizedKey as Hex);

	// Encrypt and store
	const { encrypted, salt, iv } = await encrypt(normalizedKey, password);

	const stored: StoredWallet = {
		address: account.address,
		encrypted,
		salt,
		iv,
		createdAt: Date.now(),
	};

	writeFileSync(WALLET_PATH, JSON.stringify(stored, null, 2));

	// Set as current
	currentAccount = account;
	currentPrivateKey = normalizedKey as Hex;

	return account.address;
}

/**
 * Unlock the wallet with password
 */
export async function unlockWallet(
	password: string,
): Promise<PrivateKeyAccount> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const data = readFileSync(WALLET_PATH, "utf8");
	const stored: StoredWallet = JSON.parse(data);

	try {
		const privateKey = await decrypt(
			stored.encrypted,
			password,
			stored.salt,
			stored.iv,
		);

		const account = privateKeyToAccount(privateKey as Hex);

		// Verify address matches
		if (account.address.toLowerCase() !== stored.address.toLowerCase()) {
			throw new Error("Decrypted key does not match stored address");
		}

		// Set as current
		currentAccount = account;
		currentPrivateKey = privateKey as Hex;

		return account;
	} catch {
		throw new Error("Invalid password");
	}
}

/**
 * Get the current unlocked account
 */
export function getAccount(): PrivateKeyAccount {
	if (!currentAccount) {
		throw new Error("Wallet not unlocked. Please unlock your wallet first.");
	}
	return currentAccount;
}

/**
 * Get the current private key (requires explicit action)
 */
export function getPrivateKey(): Hex {
	if (!currentPrivateKey) {
		throw new Error("Wallet not unlocked. Please unlock your wallet first.");
	}
	return currentPrivateKey;
}

/**
 * Export private key with password verification
 * Use with caution - this returns the plaintext private key
 */
export async function exportPrivateKey(password: string): Promise<Hex> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const data = readFileSync(WALLET_PATH, "utf8");
	const stored: StoredWallet = JSON.parse(data);

	try {
		const privateKey = await decrypt(
			stored.encrypted,
			password,
			stored.salt,
			stored.iv,
		);

		const account = privateKeyToAccount(privateKey as Hex);

		// Verify address matches
		if (account.address.toLowerCase() !== stored.address.toLowerCase()) {
			throw new Error("Decrypted key does not match stored address");
		}

		return privateKey as Hex;
	} catch {
		throw new Error("Invalid password");
	}
}

/**
 * Get stored wallet address without unlocking
 */
export function getStoredAddress(): Address | null {
	if (!walletExists()) return null;

	try {
		const data = readFileSync(WALLET_PATH, "utf8");
		const stored: StoredWallet = JSON.parse(data);
		return stored.address;
	} catch {
		return null;
	}
}

/**
 * Lock the wallet (clear from memory)
 */
export function lockWallet(): void {
	currentAccount = null;
	currentPrivateKey = null;
}

/**
 * Delete the wallet
 */
export function deleteWallet(): void {
	if (walletExists()) {
		unlinkSync(WALLET_PATH);
	}
	lockWallet();
}

/**
 * Check if wallet is unlocked
 */
export function isUnlocked(): boolean {
	return currentAccount !== null;
}

/**
 * Sign a message with the wallet
 */
export async function signMessage(message: string): Promise<Hex> {
	const account = getAccount();
	return account.signMessage({ message });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate mnemonic phrase (basic check)
 */
export function isValidMnemonic(mnemonic: string): boolean {
	const words = mnemonic.trim().split(/\s+/);
	return words.length === 12 || words.length === 24;
}

/**
 * Get wallet creation date
 */
export function getWalletCreatedAt(): number | null {
	if (!walletExists()) return null;

	try {
		const data = readFileSync(WALLET_PATH, "utf8");
		const stored: StoredWallet = JSON.parse(data);
		return stored.createdAt;
	} catch {
		return null;
	}
}
