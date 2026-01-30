import { describe, expect, it } from "bun:test";
import {
	BRIDGE_TOKEN_IDS,
	CHAIN_IDS,
	generateBridgeSalt,
	getChainConfig,
	getSupportedChains,
	getTokenId,
	isChainSupported,
} from "./bridge";

describe("getTokenId", () => {
	it("should return token ID for valid symbols", () => {
		expect(getTokenId("ETH")).toBe(BRIDGE_TOKEN_IDS.ETH);
		expect(getTokenId("USDT")).toBe(BRIDGE_TOKEN_IDS.USDT);
		expect(getTokenId("USDC")).toBe(BRIDGE_TOKEN_IDS.USDC);
		expect(getTokenId("DAI")).toBe(BRIDGE_TOKEN_IDS.DAI);
		expect(getTokenId("BNB")).toBe(BRIDGE_TOKEN_IDS.BNB);
		expect(getTokenId("OKB")).toBe(BRIDGE_TOKEN_IDS.OKB);
		expect(getTokenId("SOL")).toBe(BRIDGE_TOKEN_IDS.SOL);
	});

	it("should handle lowercase symbols", () => {
		expect(getTokenId("eth")).toBe(BRIDGE_TOKEN_IDS.ETH);
		expect(getTokenId("usdc")).toBe(BRIDGE_TOKEN_IDS.USDC);
	});

	it("should return null for invalid symbols", () => {
		expect(getTokenId("INVALID")).toBe(null);
		expect(getTokenId("")).toBe(null);
		expect(getTokenId("BTC")).toBe(null);
	});
});

describe("getSupportedChains", () => {
	it("should return array of supported chains", () => {
		const chains = getSupportedChains();
		expect(Array.isArray(chains)).toBe(true);
		expect(chains.includes("sepolia")).toBe(true);
		expect(chains.includes("solana")).toBe(true);
	});
});

describe("getChainConfig", () => {
	it("should return config for sepolia", () => {
		const config = getChainConfig("sepolia");
		expect(config.chainId).toBe(CHAIN_IDS.SEPOLIA);
		expect(config.contractAddress).toBeTruthy();
		expect(config.rpcUrl).toBeTruthy();
	});

	it("should return config for solana", () => {
		const config = getChainConfig("solana");
		expect(config.chainId).toBe(CHAIN_IDS.SOLANA_DEVNET);
		expect(config.contractAddress).toBeTruthy();
		expect(config.rpcUrl).toContain("solana");
	});
});

describe("isChainSupported", () => {
	it("should return true for supported chains", () => {
		expect(isChainSupported("sepolia")).toBe(true);
		expect(isChainSupported("solana")).toBe(true);
	});

	it("should return false for unsupported chains", () => {
		expect(isChainSupported("mainnet")).toBe(false);
		expect(isChainSupported("arbitrum")).toBe(false);
		expect(isChainSupported("")).toBe(false);
	});
});

describe("generateBridgeSalt", () => {
	it("should generate 32-byte hex salt", () => {
		const salt = generateBridgeSalt();
		expect(salt.startsWith("0x")).toBe(true);
		// 0x + 64 hex chars = 66 total
		expect(salt.length).toBe(66);
	});

	it("should generate unique salts", () => {
		const salt1 = generateBridgeSalt();
		const salt2 = generateBridgeSalt();
		expect(salt1).not.toBe(salt2);
	});

	it("should be valid hex", () => {
		const salt = generateBridgeSalt();
		const hexPart = salt.slice(2);
		expect(/^[0-9a-f]+$/.test(hexPart)).toBe(true);
	});
});

describe("BRIDGE_TOKEN_IDS", () => {
	it("should have correct token IDs", () => {
		expect(BRIDGE_TOKEN_IDS.ETH).toBe(1);
		expect(BRIDGE_TOKEN_IDS.USDT).toBe(2);
		expect(BRIDGE_TOKEN_IDS.USDC).toBe(3);
		expect(BRIDGE_TOKEN_IDS.DAI).toBe(4);
		expect(BRIDGE_TOKEN_IDS.BNB).toBe(5);
		expect(BRIDGE_TOKEN_IDS.OKB).toBe(6);
		expect(BRIDGE_TOKEN_IDS.SOL).toBe(7);
	});
});

describe("CHAIN_IDS", () => {
	it("should have correct chain IDs", () => {
		expect(CHAIN_IDS.DEEPDEX_TESTNET).toBe(4833);
		expect(CHAIN_IDS.SEPOLIA).toBe(11155111);
		expect(CHAIN_IDS.SOLANA_DEVNET).toBe(1);
	});
});
