import { describe, expect, it } from "bun:test";
import {
	bold,
	dim,
	error,
	formatAmount,
	formatBytes,
	formatDate,
	formatDuration,
	formatHealthStatus,
	formatLeverage,
	formatPair,
	formatPercent,
	formatPnL,
	formatPrice,
	formatRelativeTime,
	formatSide,
	formatToSize,
	formatUSD,
	info,
	logBox,
	logError,
	logInfo,
	logSuccess,
	logWarning,
	parseAmountOrPercent,
	pending,
	success,
	truncateAddress,
	warning,
} from "./format";

describe("formatAmount", () => {
	it("should format bigint with decimals", () => {
		expect(formatAmount(1000000n, 6)).toBe("1");
		expect(formatAmount(1500000n, 6)).toBe("1.5");
		expect(formatAmount(0n, 6)).toBe("0");
	});

	it("should respect precision parameter", () => {
		expect(formatAmount(1234567n, 6, 2)).toBe("1.23");
		expect(formatAmount(1234567n, 6, 6)).toBe("1.234567");
	});

	it("should handle very small numbers", () => {
		const result = formatAmount(1n, 18);
		expect(result).toContain("e");
	});
});

describe("formatToSize", () => {
	it("should round to step size", () => {
		expect(formatToSize(10.567, 0.1)).toBe("10.6");
		expect(formatToSize(10.567, 0.01)).toBe("10.57");
		expect(formatToSize(10.567, 1)).toBe("11");
	});

	it("should handle string input", () => {
		expect(formatToSize("10.567", 0.1)).toBe("10.6");
	});

	it("should handle bigint input", () => {
		expect(formatToSize(1000n, 100)).toBe("1000");
	});

	it("should handle zero step size", () => {
		expect(formatToSize(10.567, 0)).toBe("10.567");
	});
});

describe("formatUSD", () => {
	it("should format to USD currency", () => {
		expect(formatUSD(1000000n)).toBe("$1.00");
		expect(formatUSD(1500000n)).toBe("$1.50");
		expect(formatUSD(0n)).toBe("$0.00");
	});

	it("should handle large amounts", () => {
		expect(formatUSD(1000000000n)).toBe("$1,000.00");
	});
});

describe("formatPercent", () => {
	it("should format positive percentages with sign", () => {
		const result = formatPercent(5.5);
		expect(result).toContain("+5.50%");
	});

	it("should format negative percentages", () => {
		const result = formatPercent(-5.5);
		expect(result).toContain("-5.50%");
	});

	it("should handle showSign=false", () => {
		const result = formatPercent(5.5, false);
		expect(result).not.toContain("+");
		expect(result).toContain("5.50%");
	});
});

describe("truncateAddress", () => {
	const address = "0x1234567890abcdef1234567890abcdef12345678" as const;

	it("should truncate with default chars", () => {
		expect(truncateAddress(address)).toBe("0x1234...5678");
	});

	it("should truncate with custom chars", () => {
		expect(truncateAddress(address, 6)).toBe("0x123456...345678");
	});
});

describe("formatDate", () => {
	it("should format Unix timestamp to date string", () => {
		// Use a fixed timestamp for testing
		const timestamp = 1700000000; // 2023-11-14
		const result = formatDate(timestamp);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});
});

describe("formatDuration", () => {
	it("should format seconds", () => {
		expect(formatDuration(5000)).toBe("5s");
	});

	it("should format minutes and seconds", () => {
		expect(formatDuration(125000)).toBe("2m 5s");
	});

	it("should format hours and minutes", () => {
		expect(formatDuration(3725000)).toBe("1h 2m");
	});

	it("should format days and hours", () => {
		expect(formatDuration(90000000)).toBe("1d 1h");
	});
});

describe("formatBytes", () => {
	it("should format bytes", () => {
		expect(formatBytes(500)).toBe("500.0 B");
	});

	it("should format KB", () => {
		expect(formatBytes(1536)).toBe("1.5 KB");
	});

	it("should format MB", () => {
		expect(formatBytes(1572864)).toBe("1.5 MB");
	});

	it("should format GB", () => {
		expect(formatBytes(1610612736)).toBe("1.5 GB");
	});
});

describe("formatLeverage", () => {
	it("should format leverage with x suffix", () => {
		expect(formatLeverage(10)).toBe("10x");
		expect(formatLeverage(1)).toBe("1x");
		expect(formatLeverage(50)).toBe("50x");
	});
});

describe("parseAmountOrPercent", () => {
	it("should parse regular amount", () => {
		const result = parseAmountOrPercent("1000", 6);
		expect(result.amount).toBe(1000000000n);
		expect(result.displayAmount).toBe("1000");
		expect(result.isPercentage).toBe(false);
	});

	it("should parse percentage amount", () => {
		const balance = 1000000000n; // 1000 USDC
		const result = parseAmountOrPercent("50%", 6, balance);
		expect(result.amount).toBe(500000000n);
		expect(result.isPercentage).toBe(true);
		expect(result.percentage).toBe(50);
	});

	it("should parse 100% amount", () => {
		const balance = 1000000000n;
		const result = parseAmountOrPercent("100%", 6, balance);
		expect(result.amount).toBe(balance);
		expect(result.isPercentage).toBe(true);
	});

	it("should throw for invalid percentage", () => {
		expect(() => parseAmountOrPercent("-5%", 6, 1000n)).toThrow();
		expect(() => parseAmountOrPercent("101%", 6, 1000n)).toThrow();
		expect(() => parseAmountOrPercent("abc%", 6, 1000n)).toThrow();
	});

	it("should throw for percentage without balance", () => {
		expect(() => parseAmountOrPercent("50%", 6)).toThrow();
	});

	it("should throw for percentage with zero balance", () => {
		expect(() => parseAmountOrPercent("50%", 6, 0n)).toThrow(
			"No balance available",
		);
	});

	it("should throw for percentage with zero balance with token symbol", () => {
		expect(() => parseAmountOrPercent("50%", 6, 0n, "USDC")).toThrow(
			"No USDC balance available",
		);
	});
});

describe("formatPrice", () => {
	it("should format price without previous price", () => {
		const result = formatPrice(1000000n, 6);
		expect(result).toBe("1");
	});

	it("should format price with up color when higher", () => {
		const result = formatPrice(2000000n, 6, 1000000n);
		expect(result).toContain("2");
		// Contains color code for green
		expect(result).toContain("\x1b[32m");
	});

	it("should format price with down color when lower", () => {
		const result = formatPrice(500000n, 6, 1000000n);
		expect(result).toContain("0.5");
		// Contains color code for red
		expect(result).toContain("\x1b[31m");
	});

	it("should format price without color when same", () => {
		const result = formatPrice(1000000n, 6, 1000000n);
		expect(result).toBe("1");
	});
});

describe("formatPnL", () => {
	it("should format positive PnL with green color", () => {
		const result = formatPnL(1000000n);
		expect(result).toContain("+");
		expect(result).toContain("1.00");
		expect(result).toContain("\x1b[32m");
	});

	it("should format negative PnL with red color", () => {
		const result = formatPnL(-1000000n);
		expect(result).toContain("-");
		expect(result).toContain("1.00");
		expect(result).toContain("\x1b[31m");
	});

	it("should format zero PnL", () => {
		const result = formatPnL(0n);
		expect(result).toContain("+");
		expect(result).toContain("0.00");
	});
});

describe("formatRelativeTime", () => {
	it("should format relative time", () => {
		// Timestamp from about 5 seconds ago
		const fiveSecondsAgo = Math.floor(Date.now() / 1000) - 5;
		const result = formatRelativeTime(fiveSecondsAgo);
		expect(result).toContain("ago");
		expect(result).toContain("s");
	});
});

describe("formatSide", () => {
	it("should format buy side with green color and uppercase", () => {
		const result = formatSide("buy");
		expect(result).toContain("BUY");
		expect(result).toContain("\x1b[32m");
	});

	it("should format sell side with red color and uppercase", () => {
		const result = formatSide("sell");
		expect(result).toContain("SELL");
		expect(result).toContain("\x1b[31m");
	});

	it("should format long side with green color (same as buy)", () => {
		const result = formatSide("long");
		expect(result).toContain("LONG");
		expect(result).toContain("\x1b[32m");
	});

	it("should format short side with red color (same as sell)", () => {
		const result = formatSide("short");
		expect(result).toContain("SHORT");
		expect(result).toContain("\x1b[31m");
	});

	it("should format in lowercase when specified", () => {
		const result = formatSide("buy", false);
		expect(result).toContain("buy");
	});
});

describe("formatPair", () => {
	it("should format market pair with bold", () => {
		const result = formatPair("BTC-USDC");
		expect(result).toContain("BTC-USDC");
		expect(result).toContain("\x1b[1m"); // bold
	});
});

describe("success", () => {
	it("should format success message", () => {
		const result = success("Operation completed");
		expect(result).toContain("✓");
		expect(result).toContain("Operation completed");
	});
});

describe("error", () => {
	it("should format error message", () => {
		const result = error("Operation failed");
		expect(result).toContain("✗");
		expect(result).toContain("Operation failed");
	});
});

describe("warning", () => {
	it("should format warning message", () => {
		const result = warning("Be careful");
		expect(result).toContain("⚠");
		expect(result).toContain("Be careful");
	});
});

describe("info", () => {
	it("should format info message", () => {
		const result = info("Information");
		expect(result).toContain("ℹ");
		expect(result).toContain("Information");
	});
});

describe("pending", () => {
	it("should format pending message", () => {
		const result = pending("Loading...");
		expect(result).toContain("⏳");
		expect(result).toContain("Loading...");
	});
});

describe("formatHealthStatus", () => {
	it("should format ok status with success symbol", () => {
		const result = formatHealthStatus("ok");
		expect(result).toContain("✓");
		expect(result).toContain("\x1b[32m");
	});

	it("should format warning status with warning symbol", () => {
		const result = formatHealthStatus("warning");
		expect(result).toContain("⚠");
		expect(result).toContain("\x1b[33m");
	});

	it("should format critical status with error symbol", () => {
		const result = formatHealthStatus("critical");
		expect(result).toContain("✗");
		expect(result).toContain("\x1b[31m");
	});
});

describe("dim", () => {
	it("should format text with dim style", () => {
		const result = dim("dimmed text");
		expect(result).toContain("dimmed text");
		expect(result).toContain("\x1b[2m");
	});
});

describe("bold", () => {
	it("should format text with bold style", () => {
		const result = bold("bold text");
		expect(result).toContain("bold text");
		expect(result).toContain("\x1b[1m");
	});
});

describe("logSuccess", () => {
	it("should call consola.success", () => {
		// Just verify it doesn't throw
		expect(() => logSuccess("test message")).not.toThrow();
	});
});

describe("logError", () => {
	it("should call consola.error", () => {
		expect(() => logError("test error")).not.toThrow();
	});
});

describe("logWarning", () => {
	it("should call consola.warn", () => {
		expect(() => logWarning("test warning")).not.toThrow();
	});
});

describe("logInfo", () => {
	it("should call consola.info", () => {
		expect(() => logInfo("test info")).not.toThrow();
	});
});

describe("logBox", () => {
	it("should call consola.box", () => {
		expect(() => logBox("test box")).not.toThrow();
	});
});
