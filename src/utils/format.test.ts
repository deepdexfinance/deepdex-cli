import { describe, expect, it } from "bun:test";
import {
	formatAmount,
	formatBytes,
	formatDate,
	formatDuration,
	formatLeverage,
	formatPercent,
	formatToSize,
	formatUSD,
	truncateAddress,
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
