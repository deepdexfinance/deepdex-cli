/**
 * Solana Vault Service for bridge operations
 */

import { nu64, struct, u8, u32 } from "@solana/buffer-layout";
import { publicKey } from "@solana/buffer-layout-utils";
import type {
	AccountInfo,
	AccountMeta,
	Commitment,
	Connection,
	TransactionInstruction,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import {
	findVaultAssetProgramAddress,
	U32,
	U64,
} from "../utils/bridge-utils.ts";

// ============================================================================
// Types
// ============================================================================

export interface VaultIngressTokenParams {
	vaultAccountId: PublicKey;
	linkedTokenProgramId: PublicKey;
	linkedTokenSourceId: PublicKey;
	linkedTokenMintAccountId: PublicKey;
	linkedTokenDestinationId: PublicKey;
	linkedTokenAuthorityId: PublicKey;
	amount: number;
	dstChainId: number;
	receiver: Buffer;
	tokenIndex: number;
	cpiInstruction: TransactionInstruction;
}

export interface VaultIngressNativeParams {
	vaultAccountId: PublicKey;
	fromAccountId: PublicKey;
	toAccountId: PublicKey;
	amount: number;
	dstChainId: number;
	receiver: Buffer;
	tokenIndex: number;
	cpiInstruction: TransactionInstruction;
}

export interface VaultAccount {
	kind: number;
	committee_anchor: PublicKey;
	bump_seed: number;
	authority: PublicKey;
	owner: PublicKey;
	lock_fee: number;
	is_multi_sign: number;
	proposer: PublicKey;
}

export interface AssetMetaAccount {
	kind: number;
	is_native: number;
	decimals: number;
	token_index: number;
	token_mint_id: PublicKey;
}

// ============================================================================
// Buffer Layouts
// ============================================================================

export const VaultLayout = struct<VaultAccount>([
	u8("kind"),
	publicKey("committee_anchor"),
	u8("bump_seed"),
	publicKey("authority"),
	publicKey("owner"),
	nu64("lock_fee"),
	u8("is_multi_sign"),
	publicKey("proposer"),
]);

export const AssetMetaLayout = struct<AssetMetaAccount>([
	u8("kind"),
	u8("is_native"),
	u8("decimals"),
	u32("token_index"),
	publicKey("token_mint_id"),
]);

// ============================================================================
// Vault Instructions
// ============================================================================

export function VaultIngressNative(
	programId: PublicKey,
	param: VaultIngressNativeParams,
): TransactionInstruction {
	const buffers = [
		Buffer.from(Int8Array.from([1])),
		Buffer.from(new U32(param.dstChainId).toBuffer()),
		Buffer.from(new U64(param.amount).toBuffer()),
		Buffer.from(new U32(param.receiver.length).toBuffer()),
		param.receiver,
	];
	const data = Buffer.concat(buffers);
	const linedAssetMetaId = findVaultAssetProgramAddress(
		programId,
		param.vaultAccountId,
		param.tokenIndex,
	);
	const keys: AccountMeta[] = [
		{ pubkey: param.vaultAccountId, isSigner: false, isWritable: true },
		{ pubkey: linedAssetMetaId, isSigner: false, isWritable: false },
		{ pubkey: param.fromAccountId, isSigner: false, isWritable: true },
		{ pubkey: param.toAccountId, isSigner: false, isWritable: true },
	];

	keys.push({
		pubkey: param.cpiInstruction.programId,
		isSigner: false,
		isWritable: false,
	});

	for (const value of param.cpiInstruction.keys) {
		value.isSigner = false;
		keys.push(value);
	}

	return {
		programId: programId,
		keys,
		data,
	} as TransactionInstruction;
}

export function VaultIngressToken(
	programId: PublicKey,
	param: VaultIngressTokenParams,
): TransactionInstruction {
	const buffers = [
		Buffer.from(Int8Array.from([1])),
		Buffer.from(new U32(param.dstChainId).toBuffer()),
		Buffer.from(new U64(param.amount).toBuffer()),
		Buffer.from(new U32(param.receiver.length).toBuffer()),
		param.receiver,
	];
	const data = Buffer.concat(buffers);
	const linedAssetMetaId = findVaultAssetProgramAddress(
		programId,
		param.vaultAccountId,
		param.tokenIndex,
	);
	const keys: AccountMeta[] = [
		{ pubkey: param.vaultAccountId, isSigner: false, isWritable: true },
		{ pubkey: linedAssetMetaId, isSigner: false, isWritable: false },
		{ pubkey: param.linkedTokenProgramId, isSigner: false, isWritable: false },
		{ pubkey: param.linkedTokenSourceId, isSigner: false, isWritable: true },
		{
			pubkey: param.linkedTokenMintAccountId,
			isSigner: false,
			isWritable: true,
		},
		{
			pubkey: param.linkedTokenDestinationId,
			isSigner: false,
			isWritable: true,
		},
		{ pubkey: param.linkedTokenAuthorityId, isSigner: false, isWritable: true },
	];

	keys.push({
		pubkey: param.cpiInstruction.programId,
		isSigner: false,
		isWritable: false,
	});

	for (const value of param.cpiInstruction.keys) {
		value.isSigner = false;
		keys.push(value);
	}

	return {
		programId: programId,
		keys,
		data,
	} as TransactionInstruction;
}

// ============================================================================
// Account Parsers
// ============================================================================

export async function getVault(
	connection: Connection,
	address: PublicKey,
	programId: PublicKey,
	commitment?: Commitment,
): Promise<VaultAccount> {
	const info = await connection.getAccountInfo(address, commitment);
	return unpackVaultAccount(info, programId);
}

export function unpackVaultAccount(
	info: AccountInfo<Buffer> | null,
	programId: PublicKey,
): VaultAccount {
	const VAULT_ACCOUNT_SIZE = 139;
	if (!info) throw new Error("Vault account not found");
	if (!info.owner.equals(programId)) throw new Error("Invalid vault owner");
	if (info.data.length < VAULT_ACCOUNT_SIZE)
		throw new Error("Invalid vault account size");

	const rawAccount = VaultLayout.decode(info.data.slice(0, VAULT_ACCOUNT_SIZE));

	return {
		kind: rawAccount.kind,
		bump_seed: rawAccount.bump_seed,
		committee_anchor: rawAccount.committee_anchor,
		owner: rawAccount.owner,
		authority: rawAccount.authority,
		lock_fee: rawAccount.lock_fee,
		is_multi_sign: rawAccount.is_multi_sign,
		proposer: rawAccount.proposer,
	};
}

export async function getAssetMeta(
	connection: Connection,
	address: PublicKey,
	programId: PublicKey,
	commitment?: Commitment,
): Promise<AssetMetaAccount> {
	const info = await connection.getAccountInfo(address, commitment);
	return unpackAssetMetaAccount(info, programId);
}

export function unpackAssetMetaAccount(
	info: AccountInfo<Buffer> | null,
	programId: PublicKey,
): AssetMetaAccount {
	const ASSET_META_ACCOUNT_SIZE = 39;
	if (!info) throw new Error("Asset meta account not found");
	if (!info.owner.equals(programId))
		throw new Error("Invalid asset meta owner");
	if (info.data.length < ASSET_META_ACCOUNT_SIZE)
		throw new Error("Invalid asset meta account size");

	const rawAccount = AssetMetaLayout.decode(
		info.data.slice(0, ASSET_META_ACCOUNT_SIZE),
	);

	return {
		kind: rawAccount.kind,
		is_native: rawAccount.is_native,
		decimals: rawAccount.decimals,
		token_index: rawAccount.token_index,
		token_mint_id: rawAccount.token_mint_id,
	};
}

/**
 * Find vault proposal PDA
 */
export function findVaultProposalProgramAddress(
	programId: PublicKey,
	uid: Buffer,
	payloadHash: Uint8Array,
): PublicKey {
	const [publicKey] = PublicKey.findProgramAddressSync(
		[Buffer.from("vault-proposal"), uid, Buffer.from(payloadHash)],
		programId,
	);
	return publicKey;
}
