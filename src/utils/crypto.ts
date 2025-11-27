/**
 * Cryptographic utilities for wallet encryption
 */

import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Derive a key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const { pbkdf2 } = require("node:crypto");
		pbkdf2(
			password,
			salt,
			ITERATIONS,
			KEY_LENGTH,
			"sha256",
			(err: Error | null, key: Buffer) => {
				if (err) reject(err);
				else resolve(key);
			},
		);
	});
}

/**
 * Encrypt data with password
 */
export async function encrypt(
	data: string,
	password: string,
): Promise<{
	encrypted: string;
	salt: string;
	iv: string;
}> {
	const salt = randomBytes(SALT_LENGTH);
	const iv = randomBytes(IV_LENGTH);
	const key = await deriveKey(password, salt);

	const cipher = createCipheriv(ALGORITHM, key, iv);
	let encrypted = cipher.update(data, "utf8", "hex");
	encrypted += cipher.final("hex");

	const authTag = cipher.getAuthTag();
	encrypted += authTag.toString("hex");

	return {
		encrypted,
		salt: salt.toString("hex"),
		iv: iv.toString("hex"),
	};
}

/**
 * Decrypt data with password
 */
export async function decrypt(
	encrypted: string,
	password: string,
	salt: string,
	iv: string,
): Promise<string> {
	const saltBuffer = Buffer.from(salt, "hex");
	const ivBuffer = Buffer.from(iv, "hex");
	const key = await deriveKey(password, saltBuffer);

	// Extract auth tag from end of encrypted data
	const authTag = Buffer.from(encrypted.slice(-TAG_LENGTH * 2), "hex");
	const encryptedData = encrypted.slice(0, -TAG_LENGTH * 2);

	const decipher = createDecipheriv(ALGORITHM, key, ivBuffer);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedData, "hex", "utf8");
	decrypted += decipher.final("utf8");

	return decrypted;
}

/**
 * Generate a random private key
 */
export function generatePrivateKey(): string {
	return `0x${randomBytes(32).toString("hex")}`;
}

/**
 * Hash a string using SHA256
 */
export function sha256(data: string): string {
	return createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a random mnemonic-like recovery phrase
 * Note: For production, use proper BIP39 implementation
 */
export function generateMnemonic(): string {
	// Simple word list for demo purposes
	const words = [
		"abandon",
		"ability",
		"able",
		"about",
		"above",
		"absent",
		"absorb",
		"abstract",
		"absurd",
		"abuse",
		"access",
		"accident",
		"account",
		"accuse",
		"achieve",
		"acid",
		"acoustic",
		"acquire",
		"across",
		"act",
		"action",
		"actor",
		"actress",
		"actual",
		"adapt",
		"add",
		"addict",
		"address",
		"adjust",
		"admit",
		"adult",
		"advance",
		"advice",
		"aerobic",
		"affair",
		"afford",
		"afraid",
		"again",
		"age",
		"agent",
		"agree",
		"ahead",
		"aim",
		"air",
		"airport",
		"aisle",
		"alarm",
		"album",
	];

	const mnemonic: string[] = [];
	for (let i = 0; i < 12; i++) {
		const randomIndex = randomBytes(1)[0]! % words.length;
		mnemonic.push(words[randomIndex]!);
	}

	return mnemonic.join(" ");
}

/**
 * Validate a hex private key
 */
export function isValidPrivateKey(key: string): boolean {
	if (!key.startsWith("0x")) return false;
	const hex = key.slice(2);
	if (hex.length !== 64) return false;
	return /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * Securely zero out a buffer/string in memory
 */
export function secureWipe(data: Buffer | string): void {
	if (Buffer.isBuffer(data)) {
		data.fill(0);
	}
	// Note: For strings, we can't truly wipe them in JS
	// In production, consider using native bindings
}
