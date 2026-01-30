/**
 * Solana Bridge Service for cross-chain operations
 */

import {
	createAssociatedTokenAccountInstruction,
	createTransferInstruction,
	getAssociatedTokenAddress,
	getAssociatedTokenAddressSync,
	getMint,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
	ComputeBudgetProgram,
	Connection,
	PublicKey,
	SystemProgram,
	Transaction,
	type TransactionInstruction,
} from "@solana/web3.js";
import {
	findConsumerProgramAddress,
	findIndexProgramAddress,
	findPathProgramAddress,
	findRemoteAnchorProgramAddress,
	findVaultAssetProgramAddress,
	fromHexString,
	U32,
} from "../utils/bridge-utils.ts";
import {
	getAssetMeta,
	getVault,
	VaultIngressNative,
	VaultIngressToken,
} from "./vault.ts";

// ============================================================================
// Constants
// ============================================================================

export const SOLANA_BRIDGE_CONFIG = {
	bridgeProgram: "GiGXiczEg2R638z79NZfcvshQeTUNtvyxoYAggsrMZ6T",
	anchorAddress:
		"0x4d15627f4d7df17043124d045071764259797f6a94072cdbe04b571ce61bd663",
	consumerProgram: "CV4QkwXN7kM1q78anPKYpHvRJ7srVRTZVz1uhGndbfab",
	payload:
		"0x1853cedb5972c7dfc433825b1277409f71e5593560b2787a57669b9c854f5058000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000044445464700000000000000000000000000000000000000000000000000000000",
	rpc: "https://api.devnet.solana.com",
};

// ============================================================================
// Solana API Class
// ============================================================================

export class SolanaApi {
	private rpc: string;
	private consumerProgram: string;
	private _connection: Connection | null = null;

	constructor(rpc?: string, consumerProgram?: string) {
		this.rpc = rpc ?? SOLANA_BRIDGE_CONFIG.rpc;
		this.consumerProgram =
			consumerProgram ?? SOLANA_BRIDGE_CONFIG.consumerProgram;
	}

	get connection(): Connection {
		if (!this._connection) {
			this._connection = new Connection(this.rpc, "confirmed");
		}
		return this._connection;
	}

	/**
	 * Check if address is native SOL
	 */
	isNative(contractAddress?: string): boolean {
		return !contractAddress;
	}

	/**
	 * Get current slot (block height)
	 */
	async getBlockNumber(): Promise<number> {
		return await this.connection.getBlockHeight();
	}

	/**
	 * Check transaction status
	 */
	async checkTransaction(hash: string): Promise<boolean> {
		const res = await this.connection.getTransaction(hash, {
			maxSupportedTransactionVersion: 0,
		});
		if (res && !res.meta?.err) {
			return true;
		}
		return false;
	}

	/**
	 * Get balance for a Solana address
	 */
	async getBalance(params: {
		address: string;
		contractAddress?: string;
	}): Promise<bigint> {
		const publicKey = new PublicKey(params.address);
		if (this.isNative(params.contractAddress) || !params.contractAddress) {
			const balance = await this.connection.getBalance(publicKey);
			return BigInt(balance);
		}
		const mint = new PublicKey(params.contractAddress);
		const associatedToken = await getAssociatedTokenAddress(mint, publicKey);
		const balance =
			await this.connection.getTokenAccountBalance(associatedToken);
		return BigInt(balance.value.amount);
	}

	/**
	 * Create transfer transaction
	 */
	async createTransfer(params: {
		to: string;
		amount: bigint;
		contractAddress?: string;
		from: string;
	}): Promise<Transaction> {
		const fromPubkey = new PublicKey(params.from);
		const toPubkey = new PublicKey(params.to);

		if (this.isNative(params.contractAddress)) {
			const tx = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey,
					toPubkey,
					lamports: params.amount,
				}),
			);
			return tx;
		}

		const mint = new PublicKey(params.contractAddress!);
		const fromTokenAccount = await getAssociatedTokenAddress(mint, fromPubkey);
		const toTokenAccount = await getAssociatedTokenAddress(mint, toPubkey);
		const instructions: TransactionInstruction[] = [];

		const associatedTokenAccount =
			await this.connection.getAccountInfo(toTokenAccount);
		if (!associatedTokenAccount) {
			instructions.push(
				createAssociatedTokenAccountInstruction(
					fromPubkey,
					toTokenAccount,
					toPubkey,
					mint,
				),
			);
		}

		instructions.push(
			createTransferInstruction(
				fromTokenAccount,
				toTokenAccount,
				fromPubkey,
				params.amount,
			),
		);

		const tx = new Transaction().add(...instructions);
		return tx;
	}

	/**
	 * Get token info from mint
	 */
	async getTokenInfo(mintAddress: string): Promise<{
		decimals: number;
		address: string;
		name: string;
		symbol: string;
	}> {
		const mint = new PublicKey(mintAddress);
		const mintInfo = await getMint(this.connection, mint);
		return {
			decimals: mintInfo.decimals,
			address: mintAddress,
			name: "Unknown",
			symbol: "Unknown",
		};
	}

	/**
	 * Bridge tokens from Solana to DeepDEX
	 */
	async bridgeOut(params: {
		amount: bigint;
		contractAddress?: string;
		from: string;
		to: string;
		dstChainId: number;
		tokenId: number;
	}): Promise<Transaction> {
		const payer = new PublicKey(params.from);
		const bridgeProgram = new PublicKey(SOLANA_BRIDGE_CONFIG.bridgeProgram);
		const anchorAccountId = new PublicKey(
			fromHexString(SOLANA_BRIDGE_CONFIG.anchorAddress),
		);
		const pathAccountId = findPathProgramAddress(
			bridgeProgram,
			params.dstChainId,
		);
		const remoteAccountId = findRemoteAnchorProgramAddress(
			bridgeProgram,
			anchorAccountId,
			params.dstChainId,
		);
		const consumerProgramId = new PublicKey(this.consumerProgram);
		const consumerAccountId = findConsumerProgramAddress(
			consumerProgramId,
			anchorAccountId,
		);

		const crossType = Buffer.alloc(32);
		const valueFeed = Buffer.alloc(32);
		const payload = Buffer.from(fromHexString(SOLANA_BRIDGE_CONFIG.payload));

		// Build SendParcel instruction
		const sendParcelIx = this.buildSendParcelInstruction(bridgeProgram, {
			anchorAccountId,
			pathAccountId,
			sender: payer,
			consumerAccountId,
			remoteAnchorAccountId: remoteAccountId,
			refundAddress: payer.toBuffer(),
			crossType,
			valueFeed,
			dstChainId: params.dstChainId,
			payload,
		});

		const assetMetaAccountId = findVaultAssetProgramAddress(
			consumerProgramId,
			consumerAccountId,
			params.tokenId,
		);
		const _metaData = await getAssetMeta(
			this.connection,
			assetMetaAccountId,
			consumerProgramId,
		);
		const vaultData = await getVault(
			this.connection,
			consumerAccountId,
			consumerProgramId,
		);

		let consumerInstruction: TransactionInstruction;

		if (params.contractAddress) {
			const token = new PublicKey(params.contractAddress);
			const linkedSource = await getAssociatedTokenAddress(token, payer);
			const linkedDestination = getAssociatedTokenAddressSync(
				token,
				vaultData.authority,
				true,
			);

			consumerInstruction = VaultIngressToken(consumerProgramId, {
				vaultAccountId: consumerAccountId,
				linkedTokenProgramId: TOKEN_PROGRAM_ID,
				linkedTokenSourceId: linkedSource,
				linkedTokenMintAccountId: token,
				linkedTokenDestinationId: linkedDestination,
				linkedTokenAuthorityId: payer,
				amount: Number(params.amount),
				dstChainId: params.dstChainId,
				tokenIndex: params.tokenId,
				receiver: Buffer.from(fromHexString(params.to)),
				cpiInstruction: sendParcelIx,
			});
		} else {
			consumerInstruction = VaultIngressNative(consumerProgramId, {
				vaultAccountId: consumerAccountId,
				fromAccountId: payer,
				toAccountId: vaultData.authority,
				amount: Number(params.amount),
				dstChainId: params.dstChainId,
				tokenIndex: params.tokenId,
				receiver: Buffer.from(fromHexString(params.to)),
				cpiInstruction: sendParcelIx,
			});
		}

		const tx = new Transaction().add(consumerInstruction);
		tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }));
		return tx;
	}

	/**
	 * Build SendParcel instruction for bridge
	 */
	private buildSendParcelInstruction(
		programId: PublicKey,
		params: {
			anchorAccountId: PublicKey;
			pathAccountId: PublicKey;
			sender: PublicKey;
			consumerAccountId: PublicKey;
			remoteAnchorAccountId: PublicKey;
			refundAddress: Buffer;
			crossType: Buffer;
			valueFeed: Buffer;
			dstChainId: number;
			payload: Buffer;
		},
	): TransactionInstruction {
		const buffers = [
			Buffer.from([1]),
			Buffer.alloc(32).fill(params.refundAddress),
			Buffer.alloc(32).fill(params.crossType),
			new U32(params.valueFeed.length).toBuffer(),
			params.valueFeed,
			new U32(params.dstChainId).toBuffer(),
			new U32(params.payload.length).toBuffer(),
			params.payload,
		];
		const data = Buffer.concat(buffers);
		const indexAccountId = findIndexProgramAddress(programId);

		const keys = [
			{ pubkey: params.pathAccountId, isSigner: false, isWritable: true },
			{ pubkey: params.anchorAccountId, isSigner: false, isWritable: true },
			{ pubkey: params.sender, isSigner: true, isWritable: true },
			{ pubkey: params.consumerAccountId, isSigner: true, isWritable: true },
			{
				pubkey: params.remoteAnchorAccountId,
				isSigner: false,
				isWritable: false,
			},
			{ pubkey: indexAccountId, isSigner: false, isWritable: true },
			{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
		];

		return {
			programId,
			keys,
			data,
		} as TransactionInstruction;
	}
}
