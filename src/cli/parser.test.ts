import { describe, expect, it } from "bun:test";
import { getFlag, optionalArg, parseArgs, requireArg } from "../cli/parser";

describe("parseArgs", () => {
	it("should parse simple command", () => {
		const result = parseArgs(["wallet", "list"]);
		expect(result.command).toEqual(["wallet", "list"]);
		expect(result.positional).toEqual([]);
	});

	it("should parse long flags with values", () => {
		const result = parseArgs(["wallet", "--account", "main"]);
		expect(result.raw.account).toBe("main");
		expect(result.flags.account).toBe("main");
	});

	it("should parse boolean flags", () => {
		const result = parseArgs(["wallet", "--json", "--verbose"]);
		expect(result.raw.json).toBe(true);
		expect(result.raw.verbose).toBe(true);
		expect(result.flags.json).toBe(true);
		expect(result.flags.verbose).toBe(true);
	});

	it("should parse --yes flag", () => {
		const result = parseArgs(["config", "--yes"]);
		expect(result.raw.yes).toBe(true);
		expect(result.flags.yes).toBe(true);
	});

	it("should parse --dry-run flag", () => {
		const result = parseArgs(["order", "--dry-run"]);
		expect(result.raw["dry-run"]).toBe(true);
		expect(result.flags.dryRun).toBe(true);
	});

	it("should parse --help flag", () => {
		const result = parseArgs(["wallet", "--help"]);
		expect(result.raw.help).toBe(true);
	});

	it("should parse short flags", () => {
		const result = parseArgs(["wallet", "-y", "-v"]);
		expect(result.raw.yes).toBe(true);
		expect(result.raw.verbose).toBe(true);
	});

	it("should parse short flag -a with value", () => {
		const result = parseArgs(["wallet", "-a", "subaccount1"]);
		expect(result.raw.account).toBe("subaccount1");
		expect(result.flags.account).toBe("subaccount1");
	});

	it("should parse positional arguments", () => {
		const result = parseArgs(["spot", "buy", "BTC-USDC", "100"]);
		expect(result.command.includes("spot")).toBe(true);
		expect(
			result.positional.includes("100") || result.command.includes("100"),
		).toBe(true);
	});

	it("should parse numeric flag values", () => {
		const result = parseArgs(["perp", "--leverage", "10"]);
		expect(result.raw.leverage).toBe(10);
	});

	it("should parse boolean string values", () => {
		const result = parseArgs(["config", "--value", "true"]);
		expect(result.raw.value).toBe(true);
	});

	it("should parse --daemon flag", () => {
		const result = parseArgs(["bot", "--daemon"]);
		expect(result.raw.daemon).toBe(true);
	});

	it("should parse --follow flag", () => {
		const result = parseArgs(["pm", "logs", "--follow"]);
		expect(result.raw.follow).toBe(true);
	});

	it("should parse --watch flag", () => {
		const result = parseArgs(["market", "--watch"]);
		expect(result.raw.watch).toBe(true);
	});

	it("should parse --quiet flag", () => {
		const result = parseArgs(["order", "--quiet"]);
		expect(result.raw.quiet).toBe(true);
	});

	it("should parse --post-only flag", () => {
		const result = parseArgs(["spot", "buy", "--post-only"]);
		expect(result.raw["post-only"]).toBe(true);
	});

	it("should parse --reduce-only flag", () => {
		const result = parseArgs(["perp", "long", "--reduce-only"]);
		expect(result.raw["reduce-only"]).toBe(true);
	});

	it("should handle flags without values as boolean true", () => {
		const result = parseArgs(["config", "--unknown"]);
		expect(result.raw.unknown).toBe(true);
	});
});

describe("getFlag", () => {
	it("should return flag value", () => {
		const raw = { account: "main", leverage: 10 };
		expect(getFlag(raw, "account")).toBe("main");
		expect(getFlag(raw, "leverage")).toBe(10);
	});

	it("should return undefined for missing flag", () => {
		const raw = { account: "main" };
		expect(getFlag(raw, "missing")).toBeUndefined();
	});

	it("should return default value for missing flag", () => {
		const raw = { account: "main" };
		expect(getFlag(raw, "missing", "default")).toBe("default");
	});
});

describe("requireArg", () => {
	it("should return the argument at index", () => {
		const args = ["BTC-USDC", "100"];
		expect(requireArg(args, 0, "pair")).toBe("BTC-USDC");
		expect(requireArg(args, 1, "amount")).toBe("100");
	});

	it("should throw for missing argument", () => {
		const args = ["BTC-USDC"];
		expect(() => requireArg(args, 1, "amount")).toThrow(
			"Missing required argument: <amount>",
		);
	});
});

describe("optionalArg", () => {
	it("should return the argument at index", () => {
		const args = ["BTC-USDC", "100"];
		expect(optionalArg(args, 0)).toBe("BTC-USDC");
		expect(optionalArg(args, 1)).toBe("100");
	});

	it("should return undefined for missing argument", () => {
		const args = ["BTC-USDC"];
		expect(optionalArg(args, 1)).toBeUndefined();
	});

	it("should return default value for missing argument", () => {
		const args = ["BTC-USDC"];
		expect(optionalArg(args, 1, "100")).toBe("100");
	});
});
