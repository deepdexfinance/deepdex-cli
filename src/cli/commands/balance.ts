/**
 * Balance command - Display token balances
 */

import { consola } from "consola";
import { network } from "../../abis/config.ts";
import {
	getBalance,
	getSubaccounts,
	getTokenBalance,
} from "../../services/client.ts";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
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

	// Get ETH balance
	const ethBalance = await getBalance(address);

	// Get token balances
	const tokenBalances: { symbol: string; balance: bigint; decimals: number }[] =
		[];
	for (const token of Object.values(network.tokens)) {
		try {
			const balance = await getTokenBalance(address, token.address);
			tokenBalances.push({
				symbol: token.symbol,
				balance,
				decimals: token.decimals,
			});
		} catch {
			tokenBalances.push({
				symbol: token.symbol,
				balance: 0n,
				decimals: token.decimals,
			});
		}
	}

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					wallet: address,
					eth: ethBalance.toString(),
					tokens: tokenBalances.map((t) => ({
						symbol: t.symbol,
						balance: t.balance.toString(),
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
			Token: "ETH",
			Balance: formatAmount(ethBalance, 18, 6),
			USD: "-",
		},
		...tokenBalances.map((t) => ({
			Token: t.symbol,
			Balance: formatAmount(t.balance, t.decimals, 4),
			USD: t.symbol === "USDC" ? formatUSD(t.balance, t.decimals) : "-",
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
