import { describe, expect, it } from "bun:test";
import { privateKeyToAccount } from "viem/accounts";
import { isValidMnemonic } from "./wallet";

/**
 * Wallet service tests
 *
 * Some tests require TEST_WALLET_PRIVATE_KEY environment variable
 * to test wallet import and address derivation functionality.
 *
 * Example: TEST_WALLET_PRIVATE_KEY=0x... bun test
 */

const TEST_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY as
	| `0x${string}`
	| undefined;

describe("wallet address derivation", () => {
	it.skipIf(!TEST_PRIVATE_KEY)("should derive address from private key", () => {
		if (!TEST_PRIVATE_KEY) {
			return;
		}

		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		expect(account.address).toBeTruthy();
		expect(account.address.startsWith("0x")).toBe(true);
		expect(account.address.length).toBe(42);
	});

	it.skipIf(!TEST_PRIVATE_KEY)(
		"should consistently derive same address",
		() => {
			if (!TEST_PRIVATE_KEY) {
				return;
			}

			const account1 = privateKeyToAccount(TEST_PRIVATE_KEY);
			const account2 = privateKeyToAccount(TEST_PRIVATE_KEY);

			expect(account1.address).toBe(account2.address);
		},
	);

	it.skipIf(!TEST_PRIVATE_KEY)("should sign messages", async () => {
		if (!TEST_PRIVATE_KEY) {
			return;
		}

		const account = privateKeyToAccount(TEST_PRIVATE_KEY);
		const message = "Hello, DeepDex!";

		const signature = await account.signMessage({ message });

		expect(signature).toBeTruthy();
		expect(signature.startsWith("0x")).toBe(true);
	});
});

describe("isValidMnemonic", () => {
	it("should validate 12-word mnemonic", () => {
		// Valid format (12 words)
		const mnemonic =
			"word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";
		expect(isValidMnemonic(mnemonic)).toBe(true);
	});

	it("should validate 24-word mnemonic", () => {
		const mnemonic = Array(24).fill("word").join(" ");
		expect(isValidMnemonic(mnemonic)).toBe(true);
	});

	it("should reject mnemonic with wrong word count", () => {
		const shortMnemonic = "word1 word2 word3";
		expect(isValidMnemonic(shortMnemonic)).toBe(false);
	});

	it("should reject empty mnemonic", () => {
		expect(isValidMnemonic("")).toBe(false);
	});
});

describe("private key validation (via viem)", () => {
	it("should create account from valid private key", () => {
		const validKey =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as const;

		const account = privateKeyToAccount(validKey);

		expect(account.address).toBeTruthy();
		expect(account.address.startsWith("0x")).toBe(true);
	});

	it("should fail with invalid private key", () => {
		const invalidKey = "0x1234" as const;

		expect(() => privateKeyToAccount(invalidKey)).toThrow();
	});
});
