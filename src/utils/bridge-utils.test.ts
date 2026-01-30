import { describe, expect, it } from "bun:test";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import {
	findConsumerProgramAddress,
	findIndexProgramAddress,
	findPathProgramAddress,
	findRemoteAnchorProgramAddress,
	findVaultAssetProgramAddress,
	fromHexString,
	U8,
	U16,
	U32,
	U64,
	U128,
	zeroPadValue,
} from "./bridge-utils";

describe("U8", () => {
	it("should convert to little-endian buffer", () => {
		const u8 = new U8(255);
		const buffer = u8.toBuffer();
		expect(buffer.length).toBe(1);
		expect(buffer[0]).toBe(255);
	});

	it("should convert to big-endian buffer", () => {
		const u8 = new U8(128);
		const buffer = u8.toBuffer("be");
		expect(buffer[0]).toBe(128);
	});

	it("should throw for values too large", () => {
		const u8 = new U8(256);
		expect(() => u8.toBuffer()).toThrow("U8 is too large");
	});

	it("should convert from little-endian buffer", () => {
		const buffer = Buffer.from([42]);
		const result = U8.fromBuffer(buffer);
		expect(result.toNumber()).toBe(42);
	});

	it("should throw for invalid buffer length", () => {
		const buffer = Buffer.from([1, 2]);
		expect(() => U8.fromBuffer(buffer)).toThrow("Buffer length must be 1");
	});
});

describe("U16", () => {
	it("should convert to little-endian buffer", () => {
		const u16 = new U16(256);
		const buffer = u16.toBuffer();
		expect(buffer.length).toBe(2);
		// Little endian: 0x0100 -> [0x00, 0x01]
		expect(buffer[0]).toBe(0);
		expect(buffer[1]).toBe(1);
	});

	it("should convert to big-endian buffer", () => {
		const u16 = new U16(256);
		const buffer = u16.toBuffer("be");
		// Big endian: 0x0100 -> [0x01, 0x00]
		expect(buffer[0]).toBe(1);
		expect(buffer[1]).toBe(0);
	});

	it("should throw for values too large", () => {
		const u16 = new U16(65536);
		expect(() => u16.toBuffer()).toThrow("U16 is too large");
	});

	it("should convert from buffer", () => {
		const buffer = Buffer.from([0x00, 0x01]); // LE: 256
		const result = U16.fromBuffer(buffer);
		expect(result.toNumber()).toBe(256);
	});

	it("should throw for invalid buffer length", () => {
		const buffer = Buffer.from([1]);
		expect(() => U16.fromBuffer(buffer)).toThrow("Buffer length must be 2");
	});
});

describe("U32", () => {
	it("should convert to little-endian buffer", () => {
		const u32 = new U32(12345678);
		const buffer = u32.toBuffer();
		expect(buffer.length).toBe(4);
	});

	it("should convert to big-endian buffer", () => {
		const u32 = new U32(12345678);
		const buffer = u32.toBuffer("be");
		expect(buffer.length).toBe(4);
	});

	it("should throw for values too large", () => {
		const u32 = new U32(0x100000000);
		expect(() => u32.toBuffer()).toThrow("U32 is too large");
	});

	it("should convert from buffer", () => {
		const buffer = Buffer.from([0x78, 0x56, 0x34, 0x12]); // LE
		const result = U32.fromBuffer(buffer);
		expect(result.toNumber()).toBe(0x12345678);
	});

	it("should throw for invalid buffer length", () => {
		const buffer = Buffer.from([1, 2]);
		expect(() => U32.fromBuffer(buffer)).toThrow("Buffer length must be 4");
	});
});

describe("U64", () => {
	it("should convert to little-endian buffer", () => {
		const u64 = new U64(123456789);
		const buffer = u64.toBuffer();
		expect(buffer.length).toBe(8);
	});

	it("should convert to big-endian buffer", () => {
		const u64 = new U64(123456789);
		const buffer = u64.toBuffer("be");
		expect(buffer.length).toBe(8);
	});

	it("should throw for values too large", () => {
		// Create a value larger than 2^64
		const large = new BigNumber(2).pow(64).plus(1);
		const u64 = new U64(large);
		expect(() => u64.toBuffer()).toThrow("U64 is too large");
	});

	it("should convert from buffer", () => {
		const buffer = Buffer.from([0x15, 0xcd, 0x5b, 0x07, 0, 0, 0, 0]);
		const result = U64.fromBuffer(buffer);
		expect(result.toNumber()).toBe(123456789);
	});

	it("should throw for invalid buffer length", () => {
		const buffer = Buffer.from([1, 2, 3, 4]);
		expect(() => U64.fromBuffer(buffer)).toThrow("Buffer length must be 8");
	});
});

describe("U128", () => {
	it("should convert to little-endian buffer", () => {
		const u128 = new U128(123456789);
		const buffer = u128.toBuffer();
		expect(buffer.length).toBe(16);
	});

	it("should convert to big-endian buffer", () => {
		const u128 = new U128(123456789);
		const buffer = u128.toBuffer("be");
		expect(buffer.length).toBe(16);
	});

	it("should throw for values too large", () => {
		// Create a value larger than 2^128
		const large = new BigNumber(2).pow(128).plus(1);
		const u128 = new U128(large);
		expect(() => u128.toBuffer()).toThrow("U128 is too large");
	});

	it("should convert from buffer", () => {
		const buffer = Buffer.alloc(16);
		buffer[0] = 0x15;
		buffer[1] = 0xcd;
		buffer[2] = 0x5b;
		buffer[3] = 0x07;
		const result = U128.fromBuffer(buffer);
		expect(result.toNumber()).toBe(123456789);
	});

	it("should throw for invalid buffer length", () => {
		const buffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
		expect(() => U128.fromBuffer(buffer)).toThrow("Buffer length must be 16");
	});
});

describe("fromHexString", () => {
	it("should convert hex string to Uint8Array", () => {
		const result = fromHexString("0x1234");
		expect(result).toEqual(new Uint8Array([0x12, 0x34]));
	});

	it("should convert hex string without 0x prefix", () => {
		const result = fromHexString("abcd");
		expect(result).toEqual(new Uint8Array([0xab, 0xcd]));
	});

	it("should handle uppercase 0X prefix", () => {
		const result = fromHexString("0X1234");
		expect(result).toEqual(new Uint8Array([0x12, 0x34]));
	});
});

describe("zeroPadValue", () => {
	it("should pad hex string to specified length", () => {
		const result = zeroPadValue("0x1234", 4);
		expect(result.length).toBe(4);
		// Should be left-padded with zeros
		expect(result[0]).toBe(0);
		expect(result[1]).toBe(0);
		expect(result[2]).toBe(0x12);
		expect(result[3]).toBe(0x34);
	});

	it("should pad Buffer to specified length", () => {
		const buffer = Buffer.from([0x12, 0x34]);
		const result = zeroPadValue(buffer, 4);
		expect(result.length).toBe(4);
		expect(result[0]).toBe(0);
		expect(result[1]).toBe(0);
	});

	it("should pad Uint8Array to specified length", () => {
		const arr = new Uint8Array([0x12, 0x34]);
		const result = zeroPadValue(arr, 4);
		expect(result.length).toBe(4);
	});

	it("should throw if value exceeds length", () => {
		expect(() => zeroPadValue("0x12345678", 2)).toThrow("exceeds 2 bytes");
	});
});

describe("PDA finders", () => {
	// Use Solana System Program and Token Program as real program IDs
	const programId = new PublicKey("11111111111111111111111111111111");
	const anchorId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

	it("findPathProgramAddress should return PublicKey", () => {
		const result = findPathProgramAddress(programId, 1);
		expect(result).toBeInstanceOf(PublicKey);
	});

	it("findIndexProgramAddress should return PublicKey", () => {
		const result = findIndexProgramAddress(programId);
		expect(result).toBeInstanceOf(PublicKey);
	});

	it("findRemoteAnchorProgramAddress should return PublicKey", () => {
		const result = findRemoteAnchorProgramAddress(programId, anchorId, 1);
		expect(result).toBeInstanceOf(PublicKey);
	});

	it("findConsumerProgramAddress should return PublicKey", () => {
		const result = findConsumerProgramAddress(programId, anchorId);
		expect(result).toBeInstanceOf(PublicKey);
	});

	it("findVaultAssetProgramAddress should return PublicKey", () => {
		const result = findVaultAssetProgramAddress(programId, anchorId, 1);
		expect(result).toBeInstanceOf(PublicKey);
	});
});
