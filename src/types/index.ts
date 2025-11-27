/**
 * Core types for DeepDex CLI
 */

import type { Address, Hex } from "viem";

// ============================================================================
// Configuration Types
// ============================================================================

export interface DeepDexConfig {
	default_account: string;
	rpc_url: string;
	confirmations: boolean;
	output_format: "table" | "json";
	notifications: {
		discord_webhook: string | null;
		telegram_bot: string | null;
	};
	trading: {
		default_leverage: number;
		max_slippage: number;
		auto_approve: boolean;
	};
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface WalletInfo {
	address: Address;
	balance: bigint;
	nonce: number;
}

export interface StoredWallet {
	address: Address;
	encrypted: string;
	salt: string;
	iv: string;
	createdAt: number;
}

// ============================================================================
// Subaccount Types
// ============================================================================

export interface Subaccount {
	address: Address;
	name: string;
	delegate?: Address;
	isMarginEnabled: boolean;
	status: number;
}

export interface SubaccountBalance {
	token: string;
	symbol: string;
	amount: bigint;
	decimals: number;
}

export interface SpotPosition {
	tokenAmount: bigint;
	openBids: bigint;
	openAsks: bigint;
	cumulativeDeposits: bigint;
	marketIndex: number;
	balanceType: number;
	openOrders: number;
}

// ============================================================================
// Market Types
// ============================================================================

export interface MarketPair {
	value: string;
	label: string;
	fee: string;
	pairId: string;
	price: string;
	isPerp: boolean;
	disabled: boolean;
	priceDecimal: number;
	orderDecimal: number;
	leverage: number;
	sizeOptions: number[];
	tokens: TokenInfo[];
}

export interface TokenInfo {
	name: string;
	address: Address;
	icon: string;
	symbol: string;
	decimals: number;
	marketId?: number;
}

export interface MarketSpec {
	minOrderSize: bigint;
	tickSize: bigint;
	stepSize: bigint;
}

export interface PerpMarket {
	id: number;
	name: string;
	baseSymbol: string;
	baseAddress: Address;
	baseDecimal: number;
	quoteMarketId: number;
	fundingRate: bigint;
	oraclePrice: bigint;
	openInterest: bigint;
	longOpenPosNum: bigint;
	shortOpenPosNum: bigint;
	takerFeeRate: number;
	makerFeeRate: number;
	maintenanceMarginRatio: bigint;
	orderSpec: MarketSpec;
}

export interface OraclePrice {
	symbol: string;
	price: bigint;
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderType = "market" | "limit";
export type OrderSide = "buy" | "sell" | "long" | "short";
export type OrderStatus = "open" | "filled" | "cancelled" | "partial";

export interface SpotOrder {
	id: bigint;
	pair: Hex;
	maker: Address;
	price: bigint;
	quoteAmount: bigint;
	baseAmount: bigint;
	createTime: number;
	status: OrderStatus;
	isBuy: boolean;
	orderType: number;
	slippage: number;
}

export interface PerpOrder {
	orderId: number;
	owner: Address;
	marketId: number;
	isLong: boolean;
	size: bigint;
	price: bigint;
	orderType: number;
	createTime: number;
	leverage: number;
	slippage: bigint;
	status: OrderStatus;
	sizeFilled: bigint;
	sizeRemain: bigint;
	takeProfit: bigint;
	stopLoss: bigint;
}

export interface ActiveOrder {
	owner: Address;
	marketId: number;
	orderSide: number;
	orderType: number;
	orderId: number;
	price: bigint;
	createdAt: number;
}

// ============================================================================
// Position Types
// ============================================================================

export interface PerpPosition {
	marketId: number;
	isLong: boolean;
	baseAssetAmount: bigint;
	entryPrice: bigint;
	leverage: number;
	lastFundingRate: bigint;
	version: bigint;
	realizedPnl: bigint;
	fundingPayment: bigint;
	owner: Address;
	takeProfit: bigint;
	stopLoss: bigint;
	liquidatePrice: bigint;
}

// ============================================================================
// Trading Types
// ============================================================================

export interface TradeOptions {
	pair: string;
	amount: number;
	price?: number;
	leverage?: number;
	takeProfit?: number;
	stopLoss?: number;
	postOnly?: boolean;
	reduceOnly?: boolean;
	account?: string;
}

// ============================================================================
// Bot Types
// ============================================================================

export type BotStrategy = "grid" | "mm" | "arbitrage" | "simple";

export interface BotConfig {
	strategy: BotStrategy;
	account: string;
	config: Record<string, unknown>;
}

export interface BotStatus {
	running: boolean;
	pid?: number;
	strategy?: BotStrategy;
	account?: string;
	startedAt?: number;
	uptime?: number;
}

// ============================================================================
// Health Check Types
// ============================================================================

export type HealthStatus = "ok" | "warning" | "critical";

export interface HealthCheck {
	component: string;
	status: HealthStatus;
	details: string;
	latency?: number;
}

export interface HealthReport {
	checks: HealthCheck[];
	overall: HealthStatus;
	timestamp: number;
}

// ============================================================================
// CLI Types
// ============================================================================

export interface GlobalFlags {
	account?: string;
	json?: boolean;
	yes?: boolean;
	verbose?: boolean;
	dryRun?: boolean;
}

export interface CommandContext {
	flags: GlobalFlags;
	args: string[];
}
