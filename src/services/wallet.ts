/**
 * Wallet management service for DeepDex CLI
 * Supports multiple wallet management
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import type { Address, Hex } from "viem";
import {
	type PrivateKeyAccount,
	privateKeyToAccount,
	generatePrivateKey as viemGeneratePrivateKey,
} from "viem/accounts";
import { ensureDirectories } from "../config/index.ts";
import type { StoredWallet, WalletStore } from "../types/index.ts";
import {
	DEFAULT_WALLET_NAME,
	WALLET_PATH,
	WALLET_STORE_VERSION,
	WALLETS_PATH,
} from "../utils/constants.ts";
import { decrypt, encrypt, isValidPrivateKey } from "../utils/crypto.ts";

// ============================================================================
// In-Memory Wallet State
// ============================================================================

let currentAccount: PrivateKeyAccount | null = null;
let currentPrivateKey: Hex | null = null;
let currentWalletName: string | null = null;

// ============================================================================
// Wallet Store Management
// ============================================================================

/**
 * Load wallet store from disk
 */
function loadWalletStore(): WalletStore {
	ensureDirectories();

	if (existsSync(WALLETS_PATH)) {
		try {
			const data = readFileSync(WALLETS_PATH, "utf8");
			return JSON.parse(data) as WalletStore;
		} catch {
			return createEmptyStore();
		}
	}

	// Migration: check for legacy single wallet
	if (existsSync(WALLET_PATH)) {
		return migrateLegacyWallet();
	}

	return createEmptyStore();
}

/**
 * Create empty wallet store
 */
function createEmptyStore(): WalletStore {
	return {
		version: WALLET_STORE_VERSION,
		activeWallet: null,
		wallets: [],
	};
}

/**
 * Migrate legacy single wallet to new multi-wallet format
 */
function migrateLegacyWallet(): WalletStore {
	try {
		const data = readFileSync(WALLET_PATH, "utf8");
		const legacy = JSON.parse(data) as Omit<StoredWallet, "name">;

		const store: WalletStore = {
			version: WALLET_STORE_VERSION,
			activeWallet: DEFAULT_WALLET_NAME,
			wallets: [
				{
					...legacy,
					name: DEFAULT_WALLET_NAME,
				},
			],
		};

		saveWalletStore(store);
		unlinkSync(WALLET_PATH);

		return store;
	} catch {
		return createEmptyStore();
	}
}

/**
 * Save wallet store to disk
 */
function saveWalletStore(store: WalletStore): void {
	ensureDirectories();
	writeFileSync(WALLETS_PATH, JSON.stringify(store, null, 2));
}

// ============================================================================
// Wallet Storage
// ============================================================================

/**
 * Check if any wallet exists
 */
export function walletExists(): boolean {
	const store = loadWalletStore();
	return store.wallets.length > 0;
}

/**
 * Check if a wallet with the given name exists
 */
export function walletNameExists(name: string): boolean {
	const store = loadWalletStore();
	return store.wallets.some((w) => w.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all wallet names
 */
export function getWalletNames(): string[] {
	const store = loadWalletStore();
	return store.wallets.map((w) => w.name);
}

/**
 * Get active wallet name
 */
export function getActiveWalletName(): string | null {
	const store = loadWalletStore();
	return store.activeWallet;
}

/**
 * Get all wallets info (name and address only)
 */
export function getAllWallets(): Array<{
	name: string;
	address: Address;
	createdAt: number;
	isActive: boolean;
}> {
	const store = loadWalletStore();
	return store.wallets.map((w) => ({
		name: w.name,
		address: w.address,
		createdAt: w.createdAt,
		isActive: w.name === store.activeWallet,
	}));
}

/**
 * Create a new wallet
 */
export async function createWallet(
	password: string,
	name?: string,
): Promise<Address> {
	ensureDirectories();
	const store = loadWalletStore();

	const walletName = name || generateWalletName(store);

	if (walletNameExists(walletName)) {
		throw new Error(`Wallet "${walletName}" already exists`);
	}

	const privateKey = viemGeneratePrivateKey();
	const account = privateKeyToAccount(privateKey);

	const { encrypted, salt, iv } = await encrypt(privateKey, password);

	const wallet: StoredWallet = {
		name: walletName,
		address: account.address,
		encrypted,
		salt,
		iv,
		createdAt: Date.now(),
	};

	store.wallets.push(wallet);

	// Set as active if it's the first wallet
	if (store.wallets.length === 1) {
		store.activeWallet = walletName;
	}

	saveWalletStore(store);

	// Set as current
	currentAccount = account;
	currentPrivateKey = privateKey;
	currentWalletName = walletName;

	return account.address;
}

/**
 * Generate a unique wallet name
 */
function generateWalletName(store: WalletStore): string {
	if (store.wallets.length === 0) {
		return DEFAULT_WALLET_NAME;
	}

	let index = store.wallets.length + 1;
	let name = `wallet-${index}`;

	while (store.wallets.some((w) => w.name === name)) {
		index++;
		name = `wallet-${index}`;
	}

	return name;
}

/**
 * Import a wallet from private key
 */
export async function importWallet(
	privateKey: string,
	password: string,
	name?: string,
): Promise<Address> {
	ensureDirectories();
	const store = loadWalletStore();

	const walletName = name || generateWalletName(store);

	if (walletNameExists(walletName)) {
		throw new Error(`Wallet "${walletName}" already exists`);
	}

	const normalizedKey = privateKey.startsWith("0x")
		? privateKey
		: `0x${privateKey}`;

	if (!isValidPrivateKey(normalizedKey)) {
		throw new Error("Invalid private key format");
	}

	const account = privateKeyToAccount(normalizedKey as Hex);

	// Check if address already exists
	const existingWallet = store.wallets.find(
		(w) => w.address.toLowerCase() === account.address.toLowerCase(),
	);
	if (existingWallet) {
		throw new Error(
			`This wallet address already exists as "${existingWallet.name}"`,
		);
	}

	const { encrypted, salt, iv } = await encrypt(normalizedKey, password);

	const wallet: StoredWallet = {
		name: walletName,
		address: account.address,
		encrypted,
		salt,
		iv,
		createdAt: Date.now(),
	};

	store.wallets.push(wallet);

	// Set as active if it's the first wallet
	if (store.wallets.length === 1) {
		store.activeWallet = walletName;
	}

	saveWalletStore(store);

	// Set as current
	currentAccount = account;
	currentPrivateKey = normalizedKey as Hex;
	currentWalletName = walletName;

	return account.address;
}

/**
 * Switch to a different wallet
 */
export function switchWallet(name: string): void {
	const store = loadWalletStore();
	const wallet = store.wallets.find(
		(w) => w.name.toLowerCase() === name.toLowerCase(),
	);

	if (!wallet) {
		throw new Error(`Wallet "${name}" not found`);
	}

	store.activeWallet = wallet.name;
	saveWalletStore(store);

	// Clear current unlocked state
	lockWallet();
}

/**
 * Rename a wallet
 */
export function renameWallet(oldName: string, newName: string): void {
	const store = loadWalletStore();

	const wallet = store.wallets.find(
		(w) => w.name.toLowerCase() === oldName.toLowerCase(),
	);

	if (!wallet) {
		throw new Error(`Wallet "${oldName}" not found`);
	}

	if (walletNameExists(newName)) {
		throw new Error(`Wallet "${newName}" already exists`);
	}

	const wasActive = store.activeWallet === wallet.name;
	wallet.name = newName;

	if (wasActive) {
		store.activeWallet = newName;
	}

	saveWalletStore(store);

	if (currentWalletName === oldName) {
		currentWalletName = newName;
	}
}

/**
 * Delete a wallet
 */
export function deleteWallet(name: string): void {
	const store = loadWalletStore();

	const index = store.wallets.findIndex(
		(w) => w.name.toLowerCase() === name.toLowerCase(),
	);

	if (index === -1) {
		throw new Error(`Wallet "${name}" not found`);
	}

	const deletedName = store.wallets[index]!.name;
	store.wallets.splice(index, 1);

	// If deleted wallet was active, switch to first available or null
	if (store.activeWallet === deletedName) {
		store.activeWallet =
			store.wallets.length > 0 ? store.wallets[0]!.name : null;
	}

	saveWalletStore(store);

	// Lock if we deleted the currently unlocked wallet
	if (currentWalletName === deletedName) {
		lockWallet();
	}
}

/**
 * Unlock the active wallet with password
 */
export async function unlockWallet(
	password: string,
	name?: string,
): Promise<PrivateKeyAccount> {
	const store = loadWalletStore();
	const walletName = name || store.activeWallet;

	if (!walletName) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const wallet = store.wallets.find((w) => w.name === walletName);

	if (!wallet) {
		throw new Error(`Wallet "${walletName}" not found`);
	}

	try {
		const privateKey = await decrypt(
			wallet.encrypted,
			password,
			wallet.salt,
			wallet.iv,
		);

		const account = privateKeyToAccount(privateKey as Hex);

		if (account.address.toLowerCase() !== wallet.address.toLowerCase()) {
			throw new Error("Decrypted key does not match stored address");
		}

		currentAccount = account;
		currentPrivateKey = privateKey as Hex;
		currentWalletName = walletName;

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
 */
export async function exportPrivateKey(
	password: string,
	name?: string,
): Promise<Hex> {
	const store = loadWalletStore();
	const walletName = name || store.activeWallet;

	if (!walletName) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const wallet = store.wallets.find((w) => w.name === walletName);

	if (!wallet) {
		throw new Error(`Wallet "${walletName}" not found`);
	}

	try {
		const privateKey = await decrypt(
			wallet.encrypted,
			password,
			wallet.salt,
			wallet.iv,
		);

		const account = privateKeyToAccount(privateKey as Hex);

		if (account.address.toLowerCase() !== wallet.address.toLowerCase()) {
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
export function getStoredAddress(name?: string): Address | null {
	const store = loadWalletStore();
	const walletName = name || store.activeWallet;

	if (!walletName) return null;

	const wallet = store.wallets.find((w) => w.name === walletName);
	return wallet?.address || null;
}

/**
 * Lock the wallet (clear from memory)
 */
export function lockWallet(): void {
	currentAccount = null;
	currentPrivateKey = null;
	currentWalletName = null;
}

/**
 * Delete all wallets
 */
export function deleteAllWallets(): void {
	if (existsSync(WALLETS_PATH)) {
		unlinkSync(WALLETS_PATH);
	}
	if (existsSync(WALLET_PATH)) {
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
 * Get currently unlocked wallet name
 */
export function getUnlockedWalletName(): string | null {
	return currentWalletName;
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
export function getWalletCreatedAt(name?: string): number | null {
	const store = loadWalletStore();
	const walletName = name || store.activeWallet;

	if (!walletName) return null;

	const wallet = store.wallets.find((w) => w.name === walletName);
	return wallet?.createdAt || null;
}

/**
 * Get wallet count
 */
export function getWalletCount(): number {
	const store = loadWalletStore();
	return store.wallets.length;
}
