import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// We need to mock the paths before importing
const testDir = join(tmpdir(), `deepdex-test-${Date.now()}`);
const _testConfigPath = join(testDir, "config.json");
const _testLogsDir = join(testDir, "logs");

// Create test directory
beforeEach(() => {
	mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
	if (existsSync(testDir)) {
		rmSync(testDir, { recursive: true, force: true });
	}
});

// Import the functions that don't rely on specific paths
import {
	getValidConfigKeys,
	isValidConfigKey,
	parseConfigValue,
	VALID_CONFIG_KEYS,
} from "./index";

describe("isValidConfigKey", () => {
	it("should return true for valid config keys", () => {
		expect(isValidConfigKey("default_account")).toBe(true);
		expect(isValidConfigKey("rpc_url")).toBe(true);
		expect(isValidConfigKey("confirmations")).toBe(true);
		expect(isValidConfigKey("output_format")).toBe(true);
		expect(isValidConfigKey("trading.default_leverage")).toBe(true);
		expect(isValidConfigKey("trading.max_slippage")).toBe(true);
		expect(isValidConfigKey("trading.auto_approve")).toBe(true);
	});

	it("should return false for invalid config keys", () => {
		expect(isValidConfigKey("invalid_key")).toBe(false);
		expect(isValidConfigKey("")).toBe(false);
		expect(isValidConfigKey("nested.invalid.key")).toBe(false);
	});
});

describe("getValidConfigKeys", () => {
	it("should return all valid config keys", () => {
		const keys = getValidConfigKeys();
		expect(keys).toEqual(VALID_CONFIG_KEYS);
		expect(keys.includes("default_account")).toBe(true);
		expect(keys.includes("trading.default_leverage")).toBe(true);
	});

	it("should return a copy of the keys array", () => {
		const keys1 = getValidConfigKeys();
		const keys2 = getValidConfigKeys();
		expect(keys1).toEqual(keys2);
		expect(keys1).not.toBe(keys2); // Different array instances
	});
});

describe("parseConfigValue", () => {
	it("should parse boolean for confirmations", () => {
		expect(parseConfigValue("confirmations", "true")).toBe(true);
		expect(parseConfigValue("confirmations", "false")).toBe(false);
		expect(parseConfigValue("confirmations", "True")).toBe(true);
	});

	it("should parse boolean for trading.auto_approve", () => {
		expect(parseConfigValue("trading.auto_approve", "true")).toBe(true);
		expect(parseConfigValue("trading.auto_approve", "false")).toBe(false);
	});

	it("should parse integer for trading.default_leverage", () => {
		expect(parseConfigValue("trading.default_leverage", "10")).toBe(10);
		expect(parseConfigValue("trading.default_leverage", "20")).toBe(20);
	});

	it("should parse float for trading.max_slippage", () => {
		expect(parseConfigValue("trading.max_slippage", "0.5")).toBe(0.5);
		expect(parseConfigValue("trading.max_slippage", "1.5")).toBe(1.5);
	});

	it("should validate output_format", () => {
		expect(parseConfigValue("output_format", "table")).toBe("table");
		expect(parseConfigValue("output_format", "json")).toBe("json");
	});

	it("should throw for invalid output_format", () => {
		expect(() => parseConfigValue("output_format", "xml")).toThrow(
			'output_format must be "table" or "json"',
		);
	});

	it("should return string for other keys", () => {
		expect(parseConfigValue("default_account", "main")).toBe("main");
		expect(parseConfigValue("rpc_url", "https://rpc.example.com")).toBe(
			"https://rpc.example.com",
		);
	});
});
