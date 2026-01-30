/**
 * EVM Bridge Service for cross-chain operations
 */

import {
	type Address,
	createPublicClient,
	http,
	type PublicClient,
	pad,
	type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import BridgeABI from "../abis/bridge.ts";
import { network } from "../abis/config.ts";

// ============================================================================
// Types & Constants
// ============================================================================

export const BRIDGE_TOKEN_IDS = {
	ETH: 1,
	USDT: 2,
	USDC: 3,
	DAI: 4,
	BNB: 5,
	OKB: 6,
	SOL: 7,
} as const;

export type BridgeTokenSymbol = keyof typeof BRIDGE_TOKEN_IDS;

export const CHAIN_IDS = {
	DEEPDEX_TESTNET: network.chainId,
	SEPOLIA: 11155111,
	SOLANA_DEVNET: 1,
} as const;

export type SupportedChain = "sepolia" | "solana";

export interface BridgeConfig {
	contractAddress: Address;
	rpcUrl: string;
	chainId: number;
}

// Bridge contract addresses per chain (for withdrawing TO these chains)
export const BRIDGE_CONFIGS: Record<SupportedChain, BridgeConfig> = {
	sepolia: {
		contractAddress: "0x493530944CCc4b5C12FDfeF74553650695148d73" as Address,
		rpcUrl: "https://rpc.sepolia.org",
		chainId: CHAIN_IDS.SEPOLIA,
	},
	solana: {
		contractAddress: "0xf01a35C347bFE2944A32d7610531f42B706301BC" as Address,
		rpcUrl: "https://api.devnet.solana.com",
		chainId: CHAIN_IDS.SOLANA_DEVNET,
	},
};

// ============================================================================
// Bridge API Class
// ============================================================================

export class BridgeApi {
	private rpcUrl: string;
	private contractAddress: Address;
	private publicClient: PublicClient;

	constructor(chain: SupportedChain) {
		const config = BRIDGE_CONFIGS[chain];
		this.rpcUrl = config.rpcUrl;
		this.contractAddress = config.contractAddress;
		this.publicClient = createPublicClient({
			chain: sepolia,
			transport: http(this.rpcUrl),
		});
	}

	/**
	 * Get the bridge fee for a transaction
	 */
	async getBridgeFee(params: {
		tokenId: number;
		dstChainId: number;
		amount: bigint;
		dstRecipient: Address;
		customData?: `0x${string}`;
	}): Promise<bigint> {
		const fee = await this.publicClient.readContract({
			address: this.contractAddress,
			abi: BridgeABI,
			functionName: "getBridgeFee",
			args: [
				BigInt(params.tokenId),
				params.dstChainId,
				params.amount,
				pad(params.dstRecipient, { size: 32 }),
				params.customData ?? "0x",
			],
		});
		return fee as bigint;
	}

	/**
	 * Bridge tokens out from DeepDEX to external chain
	 */
	async bridgeOut(
		walletClient: WalletClient,
		params: {
			dstChainId: number;
			tokenId: number;
			amount: bigint;
			dstRecipient: Address;
			refundAddress: Address;
			salt: `0x${string}`;
			signature: `0x${string}`;
			customData?: `0x${string}`;
			isNative?: boolean;
		},
	): Promise<`0x${string}`> {
		const dstRecipient = pad(params.dstRecipient, { size: 32 });

		const hash = await walletClient.writeContract({
			account: walletClient.account!,
			chain: sepolia,
			address: this.contractAddress,
			abi: BridgeABI,
			functionName: "bridgeOut",
			args: [
				params.dstChainId,
				BigInt(params.tokenId),
				params.amount,
				dstRecipient,
				params.refundAddress,
				params.salt,
				params.customData ?? "0x",
				params.signature,
			],
			value: params.isNative ? params.amount : 0n,
		});

		return hash;
	}

	/**
	 * Get token info for a given token ID
	 */
	async getTokenInfo(tokenId: number): Promise<{
		isNativeAsset: boolean;
		isGasToken: boolean;
		token: Address;
		commonDecimal: number;
		localDecimal: number;
		isConfigFixed: boolean;
	}> {
		const info = await this.publicClient.readContract({
			address: this.contractAddress,
			abi: BridgeABI,
			functionName: "tokenIdToInfo",
			args: [BigInt(tokenId)],
		});

		const [
			isNativeAsset,
			isGasToken,
			token,
			commonDecimal,
			localDecimal,
			isConfigFixed,
		] = info as [boolean, boolean, Address, number, number, boolean];

		return {
			isNativeAsset,
			isGasToken,
			token,
			commonDecimal,
			localDecimal,
			isConfigFixed,
		};
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get token ID from symbol
 */
export function getTokenId(symbol: string): number | null {
	const upperSymbol = symbol.toUpperCase() as BridgeTokenSymbol;
	return BRIDGE_TOKEN_IDS[upperSymbol] ?? null;
}

/**
 * Get supported chains
 */
export function getSupportedChains(): SupportedChain[] {
	return Object.keys(BRIDGE_CONFIGS) as SupportedChain[];
}

/**
 * Get chain config
 */
export function getChainConfig(chain: SupportedChain): BridgeConfig {
	return BRIDGE_CONFIGS[chain];
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chain: string): chain is SupportedChain {
	return chain in BRIDGE_CONFIGS;
}

/**
 * Generate a random salt for bridge transactions
 */
export function generateBridgeSalt(): `0x${string}` {
	const randomBytes = new Uint8Array(32);
	crypto.getRandomValues(randomBytes);
	return `0x${Buffer.from(randomBytes).toString("hex")}` as `0x${string}`;
}
