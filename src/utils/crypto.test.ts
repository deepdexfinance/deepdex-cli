import { describe, expect, it } from "bun:test";
import {
	decrypt,
	encrypt,
	generateMnemonic,
	generatePrivateKey,
	isValidPrivateKey,
	secureWipe,
	sha256,
} from "./crypto";

describe("encrypt and decrypt", () => {
	it("should encrypt and decrypt data successfully", async () => {
		const originalData = "Hello, World!";
		const password = "test-password-123";

		const { encrypted, salt, iv } = await encrypt(originalData, password);

		expect(encrypted).toBeTruthy();
		expect(salt).toBeTruthy();
		expect(iv).toBeTruthy();

		const decrypted = await decrypt(encrypted, password, salt, iv);
		expect(decrypted).toBe(originalData);
	});

	it("should produce different ciphertext for same data", async () => {
		const data = "test data";
		const password = "password123";

		const result1 = await encrypt(data, password);
		const result2 = await encrypt(data, password);

		// Due to random salt and IV, encrypted data should be different
		expect(result1.encrypted).not.toBe(result2.encrypted);
	});

	it("should fail decryption with wrong password", async () => {
		const data = "secret data";
		const password = "correct-password";
		const wrongPassword = "wrong-password";

		const { encrypted, salt, iv } = await encrypt(data, password);

		await expect(decrypt(encrypted, wrongPassword, salt, iv)).rejects.toThrow();
	});
});

describe("sha256", () => {
	it("should produce consistent hash for same input", () => {
		const input = "hello world";
		const hash1 = sha256(input);
		const hash2 = sha256(input);

		expect(hash1).toBe(hash2);
	});

	it("should produce different hash for different input", () => {
		const hash1 = sha256("hello");
		const hash2 = sha256("world");

		expect(hash1).not.toBe(hash2);
	});

	it("should produce 64 character hex string", () => {
		const hash = sha256("test");

		expect(hash.length).toBe(64);
		expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
	});
});

describe("generatePrivateKey", () => {
	it("should generate valid private key format", () => {
		const key = generatePrivateKey();

		expect(key.startsWith("0x")).toBe(true);
		expect(key.length).toBe(66); // 0x + 64 hex chars
	});

	it("should generate unique keys", () => {
		const key1 = generatePrivateKey();
		const key2 = generatePrivateKey();

		expect(key1).not.toBe(key2);
	});

	it("should pass validation", () => {
		const key = generatePrivateKey();
		expect(isValidPrivateKey(key)).toBe(true);
	});
});

describe("isValidPrivateKey", () => {
	it("should validate correct private key", () => {
		const validKey =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		expect(isValidPrivateKey(validKey)).toBe(true);
	});

	it("should reject key without 0x prefix", () => {
		const invalidKey =
			"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		expect(isValidPrivateKey(invalidKey)).toBe(false);
	});

	it("should reject key with wrong length", () => {
		const shortKey = "0x1234567890abcdef";
		expect(isValidPrivateKey(shortKey)).toBe(false);
	});

	it("should reject key with invalid characters", () => {
		const invalidKey =
			"0xGHIJKL7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		expect(isValidPrivateKey(invalidKey)).toBe(false);
	});

	it("should accept uppercase hex", () => {
		const upperKey =
			"0xABCDEF7890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF";
		expect(isValidPrivateKey(upperKey)).toBe(true);
	});
});

describe("generateMnemonic", () => {
	it("should generate a 12-word mnemonic", () => {
		const mnemonic = generateMnemonic();
		const words = mnemonic.split(" ");
		expect(words.length).toBe(12);
	});

	it("should generate words from the word list", () => {
		const mnemonic = generateMnemonic();
		const words = mnemonic.split(" ");
		// Each word should be a valid word (alphabetic)
		for (const word of words) {
			expect(/^[a-z]+$/.test(word)).toBe(true);
		}
	});

	it("should generate different mnemonics each time", () => {
		const mnemonic1 = generateMnemonic();
		const mnemonic2 = generateMnemonic();
		// Very unlikely to be the same
		expect(mnemonic1).not.toBe(mnemonic2);
	});
});

describe("secureWipe", () => {
	it("should zero out a buffer", () => {
		const buffer = Buffer.from([1, 2, 3, 4, 5]);
		secureWipe(buffer);
		expect(buffer.every((byte) => byte === 0)).toBe(true);
	});

	it("should handle string input without throwing", () => {
		// Strings can't be truly wiped in JS, but function should handle it
		const str = "sensitive data";
		expect(() => secureWipe(str)).not.toThrow();
	});

	it("should handle empty buffer", () => {
		const buffer = Buffer.alloc(0);
		expect(() => secureWipe(buffer)).not.toThrow();
	});
});
