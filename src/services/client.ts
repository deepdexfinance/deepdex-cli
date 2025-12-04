/**
 * Blockchain client service for DeepDex CLI
 */

import {
	type Address,
	type Chain,
	createPublicClient,
	createWalletClient,
	type Hex,
	http,
	type PublicClient,
	type WalletClient,
} from "viem";
import { network, perpPairs, spotPairs } from "../abis/config.ts";
import { LendingABI } from "../abis/lending.ts";
import { PerpABI } from "../abis/perp.ts";
import { SpotABI } from "../abis/spot.ts";
import { SubaccountABI } from "../abis/subaccount.ts";
import type {
	ActiveOrder,
	MarketPair,
	OraclePrice,
	PerpMarket,
	PerpPosition,
	SpotOrder,
	Subaccount,
} from "../types/index.ts";
import { LENDING_MARKET_ID } from "../utils/constants.ts";
import { getAccount } from "./wallet.ts";

// ============================================================================
// Chain Definition
// ============================================================================

export const deepdexTestnet: Chain = {
	id: 483, // Placeholder chain ID
	name: network.name,
	nativeCurrency: {
		name: "tDGAS",
		symbol: "tDGAS",
		decimals: 18,
	},
	rpcUrls: {
		default: { http: [network.rpc] },
	},
};

// ============================================================================
// Client Instances
// ============================================================================

let publicClient: PublicClient | null = null;
let walletClient: WalletClient | null = null;

/**
 * Get or create public client
 */
export function getPublicClient(): PublicClient {
	if (!publicClient) {
		publicClient = createPublicClient({
			chain: deepdexTestnet,
			transport: http(deepdexTestnet.rpcUrls.default.http[0]),
		});
	}
	return publicClient;
}

/**
 * Get or create wallet client
 */
export function getWalletClient(): WalletClient {
	if (!walletClient) {
		const account = getAccount();
		walletClient = createWalletClient({
			account,
			chain: deepdexTestnet,
			transport: http(deepdexTestnet.rpcUrls.default.http[0]),
		});
	}
	return walletClient;
}

/**
 * Reset clients (useful when config changes)
 */
export function resetClients(): void {
	publicClient = null;
	walletClient = null;
}

// ============================================================================
// Account Operations
// ============================================================================

/**
 * Get native token balance
 */
export async function getBalance(address: Address): Promise<bigint> {
	const client = getPublicClient();
	return client.getBalance({ address });
}

/**
 * Get transaction count (nonce)
 */
export async function getNonce(address: Address): Promise<number> {
	const client = getPublicClient();
	return client.getTransactionCount({ address });
}

/**
 * Get current block number
 */
export async function getBlockNumber(): Promise<bigint> {
	const client = getPublicClient();
	return client.getBlockNumber();
}

// ============================================================================
// Subaccount Operations
// ============================================================================

/**
 * Get user's subaccounts
 * @alias getSubaccounts
 */
export async function getUserSubaccounts(
	owner: Address,
): Promise<Subaccount[]> {
	const client = getPublicClient();

	const stats = (await client.readContract({
		address: network.contracts.subaccount as Address,
		abi: SubaccountABI,
		functionName: "userStats",
		args: [owner],
	})) as {
		subaccounts: { subaccount: Address; name: Hex }[];
		number_of_sub_accounts: number;
	};

	const subaccounts: Subaccount[] = [];

	for (const sub of stats.subaccounts) {
		const info = await getSubaccountInfo(sub.subaccount);
		if (info) {
			subaccounts.push(info);
		}
	}

	return subaccounts;
}

/**
 * Get subaccount info
 */
export async function getSubaccountInfo(
	subaccountAddress: Address,
): Promise<Subaccount | null> {
	const client = getPublicClient();

	try {
		const info = (await client.readContract({
			address: network.contracts.subaccount as Address,
			abi: SubaccountABI,
			functionName: "subaccountInfo",
			args: [subaccountAddress],
		})) as {
			authority: Address;
			delegate: Address;
			name: Hex;
			status: number;
			is_margin_trading_enabled: boolean;
		};

		// Decode name from bytes
		const name = Buffer.from(info.name.slice(2), "hex")
			.toString("utf8")
			.replace(/\0/g, "");

		return {
			address: subaccountAddress,
			name: name || "default",
			delegate: info.delegate,
			isMarginEnabled: info.is_margin_trading_enabled,
			status: info.status,
		};
	} catch {
		return null;
	}
}

/**
 * Create a new subaccount
 */
export async function createSubaccount(name: string): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const nameBytes = `0x${Buffer.from(name).toString("hex")}` as Hex;

	const hash = await client.writeContract({
		address: network.contracts.subaccount as Address,
		abi: SubaccountABI,
		functionName: "initializeSubaccount",
		args: [nameBytes],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Set delegate for subaccount
 */
export async function setDelegate(
	subaccount: Address,
	delegate: Address,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.subaccount as Address,
		abi: SubaccountABI,
		functionName: "setDelegateAccount",
		args: [subaccount, delegate],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

// ============================================================================
// Market Data Operations
// ============================================================================

/**
 * Get all available markets
 */
export function getMarkets(): { spot: MarketPair[]; perp: MarketPair[] } {
	return {
		spot: spotPairs.filter((p) => !p.disabled) as MarketPair[],
		perp: perpPairs.filter((p) => !p.disabled) as MarketPair[],
	};
}

/**
 * Find market by pair string
 */
export function findMarket(pair: string): MarketPair | null {
	const normalizedPair = pair.toUpperCase();

	// Check spot markets
	const spotMarket = spotPairs.find(
		(p) => p.value.toUpperCase() === normalizedPair,
	);
	if (spotMarket) {
		return spotMarket as MarketPair;
	}

	// Check perp markets
	const perpMarket = perpPairs.find(
		(p) =>
			p.value.toUpperCase() === normalizedPair ||
			p.label.toUpperCase() === normalizedPair,
	);
	if (perpMarket) {
		return perpMarket as MarketPair;
	}

	return null;
}

/**
 * Get oracle prices for all markets
 */
export async function getOraclePrices(): Promise<OraclePrice[]> {
	const client = getPublicClient();

	const prices = (await client.readContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "getOraclePriceAll",
		args: [],
	})) as { symbol: Hex; price: bigint }[];

	return prices.map((p) => ({
		symbol: Buffer.from(p.symbol.slice(2), "hex")
			.toString("utf8")
			.replace(/\0/g, "")
			.toUpperCase(),
		price: p.price,
	}));
}

/**
 * Get perp market info
 */
export async function getPerpMarket(
	marketId: number,
): Promise<PerpMarket | null> {
	const client = getPublicClient();

	try {
		const market = (await client.readContract({
			address: network.contracts.perp as Address,
			abi: PerpABI,
			functionName: "perpMarkets",
			args: [marketId],
		})) as PerpMarket;

		return market;
	} catch {
		return null;
	}
}

/**
 * Get mark price for a perp market
 */
export async function getMarkPrice(marketId: number): Promise<bigint> {
	const client = getPublicClient();

	return client.readContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "markPriceFor",
		args: [marketId],
	}) as Promise<bigint>;
}

/**
 * Get last trade price for a perp market
 */
export async function getLastTradePrice(marketId: number): Promise<bigint> {
	const client = getPublicClient();

	return client.readContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "lastTradePriceFor",
		args: [marketId],
	}) as Promise<bigint>;
}

// ============================================================================
// Position Operations
// ============================================================================

/**
 * Get user's perp positions
 */
export async function getUserPerpPositions(
	subaccount: Address,
	marketIds: number[],
): Promise<PerpPosition[]> {
	const client = getPublicClient();

	const positions = (await client.readContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "userPerpPositions",
		args: [subaccount, marketIds],
	})) as PerpPosition[];

	// Filter out empty positions
	return positions.filter((p) => p.base_asset_amount > 0n);
}

/**
 * Get liquidation price for a position
 */
export async function getLiquidationPrice(
	subaccount: Address,
	marketId: number,
): Promise<bigint> {
	const client = getPublicClient();

	return client.readContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "getLiquidatePrice",
		args: [subaccount, marketId],
	}) as Promise<bigint>;
}

// ============================================================================
// Order Operations
// ============================================================================

/**
 * Get user's active perp orders
 */
export async function getUserActiveOrders(
	subaccount: Address,
): Promise<ActiveOrder[]> {
	const client = getPublicClient();

	return client.readContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "userActiveOrders",
		args: [subaccount],
	}) as Promise<ActiveOrder[]>;
}

/**
 * Get user's active spot orders for a pair
 */
export async function getUserSpotOrders(
	subaccount: Address,
	pairId: Hex,
): Promise<SpotOrder[]> {
	const client = getPublicClient();

	return client.readContract({
		address: network.contracts.spot as Address,
		abi: SpotABI,
		functionName: "userActiveSpotOrders",
		args: [subaccount, pairId],
	}) as Promise<SpotOrder[]>;
}

// ============================================================================
// Trading Operations
// ============================================================================

/**
 * Place a perp order
 */
export async function placePerpOrder(params: {
	subaccount: Address;
	marketId: number;
	isLong: boolean;
	size: bigint;
	price: bigint;
	orderType: number;
	leverage: number;
	takeProfit: bigint;
	stopLoss: bigint;
	reduceOnly: boolean;
	postOnly: number;
}): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "placePerpOrder",
		args: [
			params.subaccount,
			params.marketId,
			params.isLong,
			params.size,
			params.price,
			params.orderType,
			params.leverage,
			params.takeProfit,
			params.stopLoss,
			params.reduceOnly,
			params.postOnly,
		],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Close a perp position
 */
export async function closePosition(
	subaccount: Address,
	marketId: number,
	price: bigint,
	slippage: bigint,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "closePosition",
		args: [subaccount, marketId, price, slippage],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Cancel a perp order
 */
export async function cancelPerpOrder(
	subaccount: Address,
	marketId: number,
	orderId: number,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "cancelOrder",
		args: [subaccount, marketId, orderId],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Place a spot buy order (limit)
 */
export async function placeSpotBuyOrder(params: {
	subaccount: Address;
	pairId: Hex;
	quoteAmount: bigint;
	baseAmount: bigint;
	postOnly: number;
	reduceOnly: boolean;
}): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.spot as Address,
		abi: SpotABI,
		functionName: "subaccountPlaceOrderBuyB",
		args: [
			params.subaccount,
			params.pairId,
			params.quoteAmount,
			params.baseAmount,
			params.postOnly,
			params.reduceOnly,
		],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Place a spot sell order (limit)
 */
export async function placeSpotSellOrder(params: {
	subaccount: Address;
	pairId: Hex;
	quoteAmount: bigint;
	baseAmount: bigint;
	postOnly: number;
	reduceOnly: boolean;
}): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.spot as Address,
		abi: SpotABI,
		functionName: "subaccountPlaceOrderSellB",
		args: [
			params.subaccount,
			params.pairId,
			params.quoteAmount,
			params.baseAmount,
			params.postOnly,
			params.reduceOnly,
		],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Place a spot market buy order
 */
export async function placeSpotMarketBuy(params: {
	subaccount: Address;
	pairId: Hex;
	quoteAmount: bigint;
	baseAmount: bigint;
	autoCancel: boolean;
	reduceOnly: boolean;
}): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();
	const hash = await client.writeContract({
		address: network.contracts.spot as Address,
		abi: SpotABI,
		functionName: "subaccountPlaceMarketOrderBuyBWithoutPrice",
		args: [
			params.subaccount,
			params.pairId,
			params.quoteAmount,
			params.baseAmount,
			params.autoCancel,
			params.reduceOnly,
		],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Place a spot market sell order
 */
export async function placeSpotMarketSell(params: {
	subaccount: Address;
	pairId: Hex;
	quoteAmount: bigint;
	baseAmount: bigint;
	autoCancel: boolean;
	reduceOnly: boolean;
}): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.spot as Address,
		abi: SpotABI,
		functionName: "subaccountPlaceMarketOrderSellBWithoutPrice",
		args: [
			params.subaccount,
			params.pairId,
			params.quoteAmount,
			params.baseAmount,
			params.autoCancel,
			params.reduceOnly,
		],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Cancel a spot order
 */
export async function cancelSpotOrder(
	subaccount: Address,
	pairId: Hex,
	orderId: bigint,
	isBuy: boolean,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const functionName = isBuy
		? "subaccountCancelOrderBuyB"
		: "subaccountCancelOrderSellB";

	const hash = await client.writeContract({
		address: network.contracts.spot as Address,
		abi: SpotABI,
		functionName,
		args: [subaccount, pairId, orderId],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

// ============================================================================
// Free Deposit Operations
// ============================================================================

/**
 * Get free deposit (available balance) for perp trading
 */
export async function getFreeDeposit(subaccount: Address): Promise<bigint> {
	const client = getPublicClient();

	return client.readContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "freeDepositFor",
		args: [subaccount],
	}) as Promise<bigint>;
}

/**
 * Modify take profit and stop loss
 */
export async function modifyTpSl(
	subaccount: Address,
	marketId: number,
	takeProfit: bigint,
	stopLoss: bigint,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	const hash = await client.writeContract({
		address: network.contracts.perp as Address,
		abi: PerpABI,
		functionName: "setProfitAndLossPoint",
		args: [subaccount, marketId, takeProfit, stopLoss],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

// ============================================================================
// Token Operations
// ============================================================================

/**
 * Get ERC20 token balance
 */
export async function getTokenBalance(
	owner: Address,
	tokenAddress: Address,
): Promise<bigint> {
	const client = getPublicClient();

	return client.readContract({
		address: tokenAddress,
		abi: [
			{
				inputs: [{ name: "owner", type: "address" }],
				name: "balanceOf",
				outputs: [{ name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
		],
		functionName: "balanceOf",
		args: [owner],
	}) as Promise<bigint>;
}

/**
 * Get token allowance
 */
export async function getAllowance(
	token: Address,
	owner: Address,
	spender: Address,
): Promise<bigint> {
	const client = getPublicClient();
	return client.readContract({
		address: token,
		abi: [
			{
				inputs: [
					{ name: "owner", type: "address" },
					{ name: "spender", type: "address" },
				],
				name: "allowance",
				outputs: [{ name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
		],
		functionName: "allowance",
		args: [owner, spender],
	}) as Promise<bigint>;
}

/**
 * Approve token spending
 */
export async function approveToken(
	token: Address,
	spender: Address,
	amount: bigint,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	return client.writeContract({
		address: token,
		abi: [
			{
				inputs: [
					{ name: "spender", type: "address" },
					{ name: "amount", type: "uint256" },
				],
				name: "approve",
				outputs: [{ name: "", type: "bool" }],
				stateMutability: "nonpayable",
				type: "function",
			},
		],
		functionName: "approve",
		args: [spender, amount],
		account,
		chain: deepdexTestnet,
	});
}

// ============================================================================
// Convenience Aliases and Helper Functions
// ============================================================================

/**
 * Alias for getUserSubaccounts
 */
export const getSubaccounts = getUserSubaccounts;

/**
 * Get user's positions for display (simplified for CLI)
 */
export async function getPositions(owner: Address): Promise<
	{
		market: string;
		isLong: boolean;
		size: bigint;
		entryPrice: bigint;
		markPrice: bigint;
		unrealizedPnl: bigint;
		leverage: number;
		takeProfit: bigint | null;
		stopLoss: bigint | null;
	}[]
> {
	// Get all perp market IDs
	const { perp } = getMarkets();
	const marketIds = perp.map((m) => Number.parseInt(m.pairId, 10));

	// Get user's subaccounts first
	const subaccounts = await getUserSubaccounts(owner);
	if (subaccounts.length === 0) return [];

	// For now, use the first subaccount
	const subaccount = subaccounts[0];
	if (!subaccount) return [];

	const positions = await getUserPerpPositions(subaccount.address, marketIds);

	return positions.map((p, i) => ({
		market: perp[i]?.value || `Market ${i}`,
		isLong: p.is_long,
		size: p.base_asset_amount,
		entryPrice: p.entry_price,
		markPrice: 0n, // Would need to fetch
		unrealizedPnl: p.realized_pnl, // Using realized_pnl from ABI
		leverage: Number(p.leverage),
		takeProfit: p.take_profit > 0n ? p.take_profit : null,
		stopLoss: p.stop_loss > 0n ? p.stop_loss : null,
	}));
}

/**
 * Get user's open orders for display (simplified for CLI)
 */
export async function getOpenOrders(owner: Address): Promise<
	{
		id: string;
		market: string;
		side: "long" | "short";
		type: string;
		price: bigint;
		orderSide: number;
	}[]
> {
	// Get user's subaccounts first
	const subaccounts = await getUserSubaccounts(owner);
	if (subaccounts.length === 0) return [];

	const subaccount = subaccounts[0];
	if (!subaccount) return [];

	const orders = await getUserActiveOrders(subaccount.address);

	return orders.map((o) => ({
		id: `0x${o.order_id.toString(16)}`,
		market: `Market ${o.market_id}`,
		side: o.order_side === 0 ? "long" : "short",
		type: o.order_type === 0 ? "market" : "limit",
		price: o.price,
		orderSide: o.order_side,
	}));
}

/**
 * Alias for cancelPerpOrder
 */
export const cancelOrder = cancelPerpOrder;

/**
 * Place spot order helper
 */
export async function placeSpotOrder(_params: {
	pair: string;
	side: "buy" | "sell";
	amount: bigint;
	price?: bigint;
	postOnly?: boolean;
	reduceOnly?: boolean;
}): Promise<Hex> {
	// This is a simplified helper - implementation would depend on actual use case
	throw new Error("Use placeSpotBuyOrder or placeSpotSellOrder directly");
}

/**
 * Deposit to subaccount
 * Deposits assets to the lending contract for a given subaccount
 * @param subaccount - The subaccount address to deposit to
 * @param token - The token symbol (e.g., "USDC", "ETH", "SOL")
 * @param amount - The amount to deposit (in token's smallest unit)
 */
export async function depositToSubaccount(
	subaccount: Address,
	token: string,
	amount: bigint,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	// Convert token symbol to bytes
	const assetBytes =
		`0x${Buffer.from(token.toLowerCase()).toString("hex")}` as Hex;

	const hash = await client.writeContract({
		address: network.contracts.lending as Address,
		abi: LendingABI,
		functionName: "deposit",
		args: [subaccount, assetBytes, amount],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Withdraw from subaccount
 * Withdraws assets from the lending contract for a given subaccount
 * @param subaccount - The subaccount address to withdraw from
 * @param token - The token symbol (e.g., "USDC", "ETH", "SOL")
 * @param amount - The amount to withdraw (in token's smallest unit)
 */
export async function withdrawFromSubaccount(
	subaccount: Address,
	token: string,
	amount: bigint,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	// Convert token symbol to bytes
	const assetBytes =
		`0x${Buffer.from(token.toUpperCase()).toString("hex")}` as Hex;

	const hash = await client.writeContract({
		address: network.contracts.lending as Address,
		abi: LendingABI,
		functionName: "withdraw",
		args: [subaccount, assetBytes, amount],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Borrow from subaccount
 * Borrows assets from the lending contract for a given subaccount
 * @param subaccount - The subaccount address to borrow from
 * @param token - The token symbol (e.g., "USDC", "ETH", "SOL")
 * @param amount - The amount to borrow (in token's smallest unit)
 */
export async function borrowFromSubaccount(
	subaccount: Address,
	token: string,
	amount: bigint,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	// Convert token symbol to bytes
	const assetBytes =
		`0x${Buffer.from(token.toUpperCase()).toString("hex")}` as Hex;

	const hash = await client.writeContract({
		address: network.contracts.lending as Address,
		abi: LendingABI,
		functionName: "borrow",
		args: [subaccount, LENDING_MARKET_ID, assetBytes, amount],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}

/**
 * Repay to subaccount
 * Repays borrowed assets to the lending contract for a given subaccount
 * @param subaccount - The subaccount address to repay for
 * @param token - The token symbol (e.g., "USDC", "ETH", "SOL")
 * @param amount - The amount to repay (in token's smallest unit)
 */
export async function repayToSubaccount(
	subaccount: Address,
	token: string,
	amount: bigint,
): Promise<Hex> {
	const client = getWalletClient();
	const account = getAccount();

	// Convert token symbol to bytes
	const assetBytes =
		`0x${Buffer.from(token.toUpperCase()).toString("hex")}` as Hex;

	const hash = await client.writeContract({
		address: network.contracts.lending as Address,
		abi: LendingABI,
		functionName: "repay",
		args: [subaccount, LENDING_MARKET_ID, assetBytes, amount],
		account,
		chain: deepdexTestnet,
	});

	return hash;
}
