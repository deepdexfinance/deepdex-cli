/**
 * Bridge utility functions for cross-chain operations
 */

import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";

// ============================================================================
// Buffer Utilities
// ============================================================================

type Endianness = "le" | "be";

export class U8 extends BigNumber {
	toBuffer(endian?: Endianness): Buffer {
		const hex = this.toString(16).padStart(2, "0");
		if (hex.length > 2) {
			throw new Error("U8 is too large");
		}
		const buffer = Buffer.from(hex, "hex");
		if ((endian ?? "le") === "le") {
			return Buffer.from(buffer).reverse();
		}
		return buffer;
	}

	static fromBuffer(buffer: Buffer, endian?: Endianness): BigNumber {
		if (buffer.length !== 1) {
			throw new Error("Buffer length must be 1 for U8");
		}
		let buf = buffer;
		if ((endian ?? "le") === "le") {
			buf = Buffer.from(buffer).reverse();
		}
		return new BigNumber(`0x${buf.toString("hex")}`);
	}
}

export class U16 extends BigNumber {
	toBuffer(endian?: Endianness): Buffer {
		const hex = this.toString(16).padStart(4, "0");
		if (hex.length > 4) {
			throw new Error("U16 is too large");
		}
		const buffer = Buffer.from(hex, "hex");
		if ((endian ?? "le") === "le") {
			return Buffer.from(buffer).reverse();
		}
		return buffer;
	}

	static fromBuffer(buffer: Buffer, endian?: Endianness): BigNumber {
		if (buffer.length !== 2) {
			throw new Error("Buffer length must be 2 for U16");
		}
		let buf = buffer;
		if ((endian ?? "le") === "le") {
			buf = Buffer.from(buffer).reverse();
		}
		return new BigNumber(`0x${buf.toString("hex")}`);
	}
}

export class U32 extends BigNumber {
	toBuffer(endian?: Endianness): Buffer {
		const hex = this.toString(16).padStart(8, "0");
		if (hex.length > 8) {
			throw new Error("U32 is too large");
		}
		const buffer = Buffer.from(hex, "hex");
		if ((endian ?? "le") === "le") {
			return Buffer.from(buffer).reverse();
		}
		return buffer;
	}

	static fromBuffer(buffer: Buffer, endian?: Endianness): BigNumber {
		if (buffer.length !== 4) {
			throw new Error("Buffer length must be 4 for U32");
		}
		let buf = buffer;
		if ((endian ?? "le") === "le") {
			buf = Buffer.from(buffer).reverse();
		}
		return new BigNumber(`0x${buf.toString("hex")}`);
	}
}

export class U64 extends BigNumber {
	toBuffer(endian?: Endianness): Buffer {
		const hex = this.toString(16).padStart(16, "0");
		if (hex.length > 16) {
			throw new Error("U64 is too large");
		}
		const buffer = Buffer.from(hex, "hex");
		if ((endian ?? "le") === "le") {
			return Buffer.from(buffer).reverse();
		}
		return buffer;
	}

	static fromBuffer(buffer: Buffer, endian?: Endianness): BigNumber {
		if (buffer.length !== 8) {
			throw new Error("Buffer length must be 8 for U64");
		}
		let buf = buffer;
		if ((endian ?? "le") === "le") {
			buf = Buffer.from(buffer).reverse();
		}
		return new BigNumber(`0x${buf.toString("hex")}`);
	}
}

export class U128 extends BigNumber {
	toBuffer(endian?: Endianness): Buffer {
		const hex = this.toString(16).padStart(32, "0");
		if (hex.length > 32) {
			throw new Error("U128 is too large");
		}
		const buffer = Buffer.from(hex, "hex");
		if ((endian ?? "le") === "le") {
			return Buffer.from(buffer).reverse();
		}
		return buffer;
	}

	static fromBuffer(buffer: Buffer, endian?: Endianness): BigNumber {
		if (buffer.length !== 16) {
			throw new Error("Buffer length must be 16 for U128");
		}
		let buf = buffer;
		if ((endian ?? "le") === "le") {
			buf = Buffer.from(buffer).reverse();
		}
		return new BigNumber(`0x${buf.toString("hex")}`);
	}
}

// ============================================================================
// Address Utilities
// ============================================================================

/**
 * Convert hex string to Uint8Array
 */
export function fromHexString(hexString: string): Uint8Array {
	let hex = hexString;
	if (hex.startsWith("0x") || hex.startsWith("0X")) {
		hex = hex.substring(2);
	}
	return new Uint8Array(
		hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
	);
}

/**
 * Zero-pad a value to specified byte length
 */
export function zeroPadValue(
	value: string | Buffer | Uint8Array,
	length: number,
): Buffer {
	let buf: Buffer;
	if (typeof value === "string") {
		buf = Buffer.from(fromHexString(value));
	} else {
		buf = Buffer.from(value);
	}

	if (buf.length > length) {
		throw new Error(`Value exceeds ${length} bytes`);
	}

	const padded = Buffer.alloc(length);
	buf.copy(padded, length - buf.length);
	return padded;
}

// ============================================================================
// Solana PDA Finders
// ============================================================================

export const PREFIX_BRIDGE_PATH = "bridge-path";
export const PREFIX_BRIDGE_INDEX_TRACKER = "bridge-index-tracker";
export const PREFIX_BRIDGE_REMOTE_ANCHOR = "bridge-remote-anchor";

export function findPathProgramAddress(
	programId: PublicKey,
	chainId: number,
): PublicKey {
	const seeds = [
		Buffer.from(PREFIX_BRIDGE_PATH),
		new U32(chainId).toBuffer("be"),
	];
	const [publicKey] = PublicKey.findProgramAddressSync(seeds, programId);
	return publicKey;
}

export function findIndexProgramAddress(programId: PublicKey): PublicKey {
	const [publicKey] = PublicKey.findProgramAddressSync(
		[Buffer.from(PREFIX_BRIDGE_INDEX_TRACKER)],
		programId,
	);
	return publicKey;
}

export function findRemoteAnchorProgramAddress(
	programId: PublicKey,
	anchorId: PublicKey,
	remoteChainId: number,
): PublicKey {
	const [publicKey] = PublicKey.findProgramAddressSync(
		[
			Buffer.from(PREFIX_BRIDGE_REMOTE_ANCHOR),
			anchorId.toBuffer(),
			new U32(remoteChainId).toBuffer("be"),
		],
		programId,
	);
	return publicKey;
}

export function findConsumerProgramAddress(
	programId: PublicKey,
	anchorId: PublicKey,
): PublicKey {
	const [publicKey] = PublicKey.findProgramAddressSync(
		[anchorId.toBuffer()],
		programId,
	);
	return publicKey;
}

export function findVaultAssetProgramAddress(
	programId: PublicKey,
	vaultAccountId: PublicKey,
	tokenIndex: number,
): PublicKey {
	const [publicKey] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("vault-asset"),
			vaultAccountId.toBuffer(),
			new U32(tokenIndex).toBuffer("be"),
		],
		programId,
	);
	return publicKey;
}
