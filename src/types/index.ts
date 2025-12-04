/**
 * Core types for DeepDex CLI
 */

import type { Address, Hex } from "viem";

// ============================================================================
// Configuration Types
// ============================================================================

export interface DeepDexConfig {
	default_account: string;
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

export interface SpotPosition {
	token_amount: bigint;
	open_bids: bigint;
	open_asks: bigint;
	cumulative_deposits: bigint;
	market_index: number;
	balance_type: number;
	open_orders: number;
	padding: string;
}

export interface BorrowPosition {
	lending_market_id: number;
	asset: string;
	amount: bigint;
	interest: bigint;
}

export interface SubaccountUser {
	authority: Address;
	delegate: Address;
	name: string;
	spot_positions: SpotPosition[];
	borrow_positions: BorrowPosition[];
	next_order_id: number;
	status: number;
	is_margin_trading_enabled: boolean;
}

export interface SimpleSubaccount {
	subaccount: Address;
	name: string;
}

export interface DelegateInfo {
	subaccount: Address;
	name: string;
}

export interface OneClickTrading {
	account: Address;
	mode: number;
	create_time: number;
}

export interface UserStats {
	subaccounts: SimpleSubaccount[];
	if_staked_quote_asset_amount: bigint;
	number_of_sub_accounts: number;
	number_of_sub_accounts_created: number;
}

export interface TotalCollateralAndMargin {
	collateral: bigint;
	margin_required: bigint;
}

// Legacy interface for CLI usage
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
	tickSize: number;
	stepSize: number;
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
	min_order_size: bigint;
	tick_size: bigint;
	step_size: bigint;
}

export interface PerpMarket {
	id: number;
	name: string;
	base_symbol: string;
	base_address: Address;
	base_decimal: number;
	quote_market_id: number;
	network: string;
	height: bigint;
	funding_rate: bigint;
	last_cacl_funding_rate_time: bigint;
	oracle_price: bigint;
	max_deviation_bps: bigint;
	liquid_spread_bps: bigint;
	maintenance_margin_ratio: bigint;
	taker_fee_rate: number;
	maker_fee_rate: number;
	order_spec: MarketSpec;
	open_interest: bigint;
	long_open_pos_num: bigint;
	short_open_pos_num: bigint;
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
	pair: Hex;
	id: bigint;
	maker: Address;
	price: bigint;
	quote_amount: bigint;
	base_amount: bigint;
	create_time: number;
	status: number;
	is_buy: boolean;
	order_type: number;
	slippage: number;
}

export interface PerpOrder {
	order_id: number;
	owner: Address;
	market_id: number;
	is_long: boolean;
	size: bigint;
	price: bigint;
	order_type: number;
	create_time: bigint;
	leverage: number;
	slippage: bigint;
	status: number;
	size_filled: bigint;
	size_remain: bigint;
	take_profit: bigint;
	stop_loss: bigint;
}

export interface ActiveOrder {
	owner: Address;
	market_id: number;
	order_side: number;
	order_type: number;
	order_id: number;
	price: bigint;
	created_at: bigint;
}

// ============================================================================
// Position Types
// ============================================================================

export interface PerpPosition {
	market_id: number;
	is_long: boolean;
	base_asset_amount: bigint;
	entry_price: bigint;
	leverage: number;
	last_funding_rate: bigint;
	version: bigint;
	realized_pnl: bigint;
	funding_payment: bigint;
	owner: Address;
	take_profit: bigint;
	stop_loss: bigint;
	liquidate_price: bigint;
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
