/**
 * Balance command - Display token balances
 */

import { consola } from "consola";
import type { Address } from "viem";
import { network } from "../../abis/config.ts";
import {
	getBalance,
	getOraclePrices,
	getSubaccounts,
	getTokenBalance,
} from "../../services/client.ts";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
import { PRICE_DECIMALS } from "../../utils/constants.ts";
import {
	dim,
	formatAmount,
	formatUSD,
	truncateAddress,
} from "../../utils/format.ts";
import { keyValue, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag } from "../parser.ts";

/**
 * Display token balances
 */
export async function run(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;
	const _accountFilter = getFlag<string>(args.raw, "account");

	consola.start("Fetching balances...");

	// Fetch oracle prices
	let oraclePrices: { symbol: string; price: bigint }[] = [];
	try {
		oraclePrices = await getOraclePrices();
	} catch {
		// Ignore errors
	}

	// Get tDGAS balance
	const gasBalance = await getBalance(address as Address);
	// For now, we don't have a price for tDGAS
	const gasUsd = 0n;

	// Get token balances
	const tokenBalances: {
		symbol: string;
		balance: bigint;
		decimals: number;
		usdValue: bigint;
	}[] = [];
	for (const token of Object.values(network.tokens)) {
		if (token.symbol === "tDGAS") continue;
		try {
			const balance = await getTokenBalance(
				address as Address,
				token.address as Address,
			);

			const price = oraclePrices.find(
				(p) => p.symbol.toUpperCase() === token.symbol.toUpperCase(),
			);

			// Price is in 6 decimals
			// USD Value = (Balance * Price) / 10^TokenDecimals
			// This results in USD Value with 6 decimals (same as Price)
			const usdValue = price
				? (balance * price.price) / 10n ** BigInt(token.decimals)
				: 0n;

			tokenBalances.push({
				symbol: token.symbol,
				balance,
				decimals: token.decimals,
				usdValue: token.symbol === "USDC" ? balance : usdValue,
			});
		} catch {
			tokenBalances.push({
				symbol: token.symbol,
				balance: 0n,
				decimals: token.decimals,
				usdValue: 0n,
			});
		}
	}

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					wallet: address,
					tDGAS: {
						balance: gasBalance.toString(),
						usd: gasUsd.toString(),
					},
					tokens: tokenBalances.map((t) => ({
						symbol: t.symbol,
						balance: t.balance.toString(),
						usd: t.usdValue.toString(),
					})),
				},
				null,
				2,
			),
		);
		return;
	}

	console.log();
	consola.box({
		title: "💰 Wallet Balances",
		message: `Address: ${truncateAddress(address)}`,
		style: {
			padding: 1,
			borderColor: "green",
			borderStyle: "rounded",
		},
	});

	console.log();

	// Wallet balances
	const walletData = [
		{
			Token: "tDGAS",
			Balance: formatAmount(gasBalance, 18, 6),
			USD: gasUsd ? formatUSD(gasUsd, PRICE_DECIMALS) : "-",
		},
		...tokenBalances.map((t) => ({
			Token: t.symbol,
			Balance: formatAmount(t.balance, t.decimals, 4),
			USD: t.usdValue > 0n ? formatUSD(t.usdValue, PRICE_DECIMALS) : "-",
		})),
	];

	console.log(
		table(
			[
				{ header: "Token", key: "Token" },
				{ header: "Balance", key: "Balance", align: "right" },
				{ header: "USD Value", key: "USD", align: "right" },
			],
			walletData,
		),
	);

	// Subaccount balances (if any)
	try {
		const subaccounts = await getSubaccounts(address);
		if (subaccounts.length > 0) {
			console.log();
			consola.box({
				title: "📂 Subaccount Balances",
				message: `${subaccounts.length} subaccount(s)`,
				style: {
					padding: 1,
					borderColor: "blue",
					borderStyle: "rounded",
				},
			});

			console.log();
			console.log(
				dim("  (Subaccount balance fetching requires additional calls)"),
			);
		}
	} catch {
		// Ignore subaccount errors
	}

	console.log();
}

/**
 * Portfolio summary with P&L
 */
export async function portfolio(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;

	consola.start("Fetching portfolio...");

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					totalValue: "0",
					marginUsed: "0",
					freeMargin: "0",
					unrealizedPnl: "0",
					realizedPnl: "0",
				},
				null,
				2,
			),
		);
		return;
	}

	console.log();
	consola.box({
		title: "📊 Portfolio Summary",
		message: `Wallet: ${truncateAddress(address)}`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	console.log(
		keyValue(
			{
				"Total Value": "$0.00",
				"Margin Used": "$0.00",
				"Free Margin": "$0.00",
				"Unrealized PnL": "$0.00",
				"Realized PnL": "$0.00",
			},
			2,
		),
	);

	console.log();
	consola.info(
		"Deposit funds to start trading: deepdex account deposit 1000 USDC",
	);
	console.log();
}
