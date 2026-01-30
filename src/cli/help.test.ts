import { describe, expect, it } from "bun:test";
import { shouldShowHelp } from "./help";

describe("shouldShowHelp", () => {
	it("should return true when help flag is present", () => {
		expect(shouldShowHelp({ help: true })).toBe(true);
		expect(shouldShowHelp({ h: true })).toBe(true);
	});

	it("should return false when help flag is absent", () => {
		expect(shouldShowHelp({})).toBe(false);
		expect(shouldShowHelp({ other: true })).toBe(false);
	});

	it("should return false when help is false", () => {
		expect(shouldShowHelp({ help: false })).toBe(false);
	});
});
