/**
 * Balance and portfolio commands
 */

import { perpPairs } from "../../abis/config.ts";
import {
	getBalance,
	getFreeDeposit,
	getOraclePrices,
	getUserPerpPositions,
	getUserSubaccounts,
} from "../../services/client.ts";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
import { PRICE_DECIMALS, USDC_DECIMALS } from "../../utils/constants.ts";
import {
	bold,
	dim,
	formatAmount,
	formatLeverage,
	formatPnL,
	formatSide,
	formatUSD,
	truncateAddress,
} from "../../utils/format.ts";
import { keyValue, spinner, table } from "../../utils/ui.ts";
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
	const accountFilter = getFlag<string>(args.raw, "account");

	const spin = spinner("Fetching balances...");
	spin.start();

	// Get wallet balance
	const walletBalance = await getBalance(address);

	// Get subaccounts
	const subaccounts = await getUserSubaccounts(address);

	// Get free deposits for each subaccount
	const subaccountBalances = await Promise.all(
		subaccounts.map(async (sub) => {
			const freeDeposit = await getFreeDeposit(sub.address);
			return {
				...sub,
				freeDeposit,
			};
		}),
	);

	spin.stop("");

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					wallet: {
						address,
						ethBalance: walletBalance.toString(),
					},
					subaccounts: subaccountBalances.map((s) => ({
						...s,
						freeDeposit: s.freeDeposit.toString(),
					})),
				},
				null,
				2,
			),
		);
		return;
	}

	console.log(bold("\n💰 Balances\n"));

	// Wallet balance
	console.log(dim("  Wallet"));
	console.log(`    Address:  ${truncateAddress(address)}`);
	console.log(`    ETH:      ${formatAmount(walletBalance, 18, 4)} ETH`);
	console.log();

	// Subaccount balances
	if (subaccountBalances.length === 0) {
		console.log(dim("  No subaccounts found."));
		console.log(dim("  Create one with: deepdex account create"));
	} else {
		console.log(dim("  Subaccounts"));

		const filteredAccounts = accountFilter
			? subaccountBalances.filter(
					(s) => s.name.toLowerCase() === accountFilter.toLowerCase(),
				)
			: subaccountBalances;

		if (filteredAccounts.length === 0) {
			console.log(dim(`    No subaccount found: ${accountFilter}`));
		} else {
			const tableData = filteredAccounts.map((sub) => ({
				Name: sub.name,
				Address: truncateAddress(sub.address),
				"Available USDC": formatUSD(sub.freeDeposit, USDC_DECIMALS),
			}));

			console.log(
				table(
					[
						{ header: "Name", key: "Name" },
						{ header: "Address", key: "Address" },
						{ header: "Available USDC", key: "Available USDC", align: "right" },
					],
					tableData,
				),
			);
		}
	}

	console.log();
}

/**
 * Display portfolio summary
 */
export async function portfolio(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;

	const spin = spinner("Fetching portfolio data...");
	spin.start();

	// Get subaccounts
	const subaccounts = await getUserSubaccounts(address);

	// Get oracle prices
	const oraclePrices = await getOraclePrices();

	// Get positions for each subaccount
	const allPositions = [];
	const marketIds = perpPairs
		.filter((p) => !p.disabled)
		.map((p) => Number.parseInt(p.pairId, 10));

	for (const sub of subaccounts) {
		const positions = await getUserPerpPositions(sub.address, marketIds);
		for (const pos of positions) {
			allPositions.push({
				...pos,
				subaccountName: sub.name,
			});
		}
	}

	// Get total balances
	let totalBalance = 0n;
	for (const sub of subaccounts) {
		const freeDeposit = await getFreeDeposit(sub.address);
		totalBalance += freeDeposit;
	}

	spin.stop("");

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					totalBalance: totalBalance.toString(),
					positions: allPositions.map((p) => ({
						...p,
						baseAssetAmount: p.baseAssetAmount.toString(),
						entryPrice: p.entryPrice.toString(),
						realizedPnl: p.realizedPnl.toString(),
						liquidatePrice: p.liquidatePrice.toString(),
					})),
				},
				null,
				2,
			),
		);
		return;
	}

	console.log(bold("\n📊 Portfolio Summary\n"));

	// Summary
	console.log(dim("  Account Overview"));
	console.log(
		keyValue(
			{
				"Total Balance": formatUSD(totalBalance, USDC_DECIMALS),
				"Open Positions": allPositions.length.toString(),
				Subaccounts: subaccounts.length.toString(),
			},
			4,
		),
	);

	// Positions
	if (allPositions.length > 0) {
		console.log(bold("\n  Open Positions\n"));

		const positionData = allPositions.map((pos) => {
			const market = perpPairs.find(
				(p) => Number.parseInt(p.pairId, 10) === pos.marketId,
			);
			const marketName = market?.value || `Market ${pos.marketId}`;
			const baseSymbol = market?.tokens[0]?.symbol || "";

			// Get oracle price for P&L calculation
			const oracle = oraclePrices.find(
				(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
			);
			const currentPrice = oracle?.price || pos.entryPrice;

			// Calculate unrealized P&L
			const sizeBigInt = pos.baseAssetAmount;
			const entryPrice = pos.entryPrice;
			const priceDiff = currentPrice - entryPrice;
			const unrealizedPnl = pos.isLong
				? (sizeBigInt * priceDiff) / 10n ** BigInt(PRICE_DECIMALS)
				: (sizeBigInt * -priceDiff) / 10n ** BigInt(PRICE_DECIMALS);

			return {
				Market: marketName,
				Side: formatSide(pos.isLong ? "long" : "short"),
				Size: formatAmount(sizeBigInt, 18, 4),
				Entry: `$${formatAmount(entryPrice, PRICE_DECIMALS, 2)}`,
				Current: `$${formatAmount(currentPrice, PRICE_DECIMALS, 2)}`,
				uPnL: formatPnL(unrealizedPnl, USDC_DECIMALS),
				Lev: formatLeverage(pos.leverage),
			};
		});

		console.log(
			table(
				[
					{ header: "Market", key: "Market" },
					{ header: "Side", key: "Side" },
					{ header: "Size", key: "Size", align: "right" },
					{ header: "Entry", key: "Entry", align: "right" },
					{ header: "Current", key: "Current", align: "right" },
					{ header: "uPnL", key: "uPnL", align: "right" },
					{ header: "Lev", key: "Lev", align: "right" },
				],
				positionData,
			),
		);
	} else {
		console.log(dim("\n  No open positions."));
	}

	console.log();
}
