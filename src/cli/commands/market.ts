/**
 * Market commands - Market data and information
 */

import {
	findMarket,
	getLastTradePrice,
	getMarkets,
	getMarkPrice,
	getOraclePrices,
	getPerpMarket,
} from "../../services/client.ts";
import { PRICE_DECIMALS } from "../../utils/constants.ts";
import {
	bold,
	dim,
	formatAmount,
	formatPair,
	formatPercent,
} from "../../utils/format.ts";
import { keyValue, spinner, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { requireArg } from "../parser.ts";

/**
 * List all available markets
 */
export async function list(args: ParsedArgs): Promise<void> {
	const { spot, perp } = getMarkets();

	// Fetch oracle prices
	const spin = spinner("Fetching market data...");
	spin.start();

	let oraclePrices: { symbol: string; price: bigint }[] = [];
	try {
		oraclePrices = await getOraclePrices();
	} catch {
		// Ignore errors, show markets without prices
	}
	spin.stop("");

	if (args.flags.json) {
		console.log(JSON.stringify({ spot, perp, oraclePrices }, null, 2));
		return;
	}

	// Spot Markets
	console.log(bold("\n📈 Spot Markets\n"));

	const spotData = spot.map((m) => {
		const baseSymbol = m.tokens[0]?.symbol || "";
		const priceInfo = oraclePrices.find(
			(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
		);
		const priceStr = priceInfo
			? formatAmount(priceInfo.price, PRICE_DECIMALS, 2)
			: "-";

		return {
			Pair: formatPair(m.value),
			Price: `$${priceStr}`,
			Fee: m.fee,
			"Min Size": m.sizeOptions[0]?.toString() || "-",
		};
	});

	console.log(
		table(
			[
				{ header: "Pair", key: "Pair" },
				{ header: "Price", key: "Price", align: "right" },
				{ header: "Fee", key: "Fee", align: "right" },
				{ header: "Min Size", key: "Min Size", align: "right" },
			],
			spotData,
		),
	);

	// Perp Markets
	console.log(bold("\n📊 Perpetual Markets\n"));

	const perpData = perp.map((m) => {
		const baseSymbol = m.tokens[0]?.symbol || "";
		const priceInfo = oraclePrices.find(
			(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
		);
		const priceStr = priceInfo
			? formatAmount(priceInfo.price, PRICE_DECIMALS, 2)
			: "-";

		return {
			Pair: formatPair(m.value),
			Price: `$${priceStr}`,
			"Max Lev": `${m.leverage}x`,
			Fee: m.fee,
		};
	});

	console.log(
		table(
			[
				{ header: "Pair", key: "Pair" },
				{ header: "Price", key: "Price", align: "right" },
				{ header: "Max Lev", key: "Max Lev", align: "right" },
				{ header: "Fee", key: "Fee", align: "right" },
			],
			perpData,
		),
	);
}

/**
 * Display market information
 */
export async function info(args: ParsedArgs): Promise<void> {
	const pair = requireArg(args.positional, 0, "pair");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (args.flags.json) {
		console.log(JSON.stringify(market, null, 2));
		return;
	}

	console.log(bold(`\n📊 Market: ${market.value}\n`));

	const data: Record<string, string> = {
		Type: market.isPerp ? "Perpetual" : "Spot",
		"Trading Fee": market.fee,
		"Price Decimals": market.priceDecimal.toString(),
		"Order Decimals": market.orderDecimal.toString(),
		"Size Options": market.sizeOptions.join(", "),
	};

	if (market.isPerp) {
		data["Max Leverage"] = `${market.leverage}x`;
		data["Market ID"] = market.pairId;
	} else {
		data["Pair ID"] = `${market.pairId.slice(0, 18)}...`;
	}

	console.log(keyValue(data, 2));

	// Tokens
	console.log(bold("\n  Tokens:"));
	for (const token of market.tokens) {
		console.log(`    ${token.symbol}: ${token.address}`);
	}

	console.log();
}

/**
 * Display current prices
 */
export async function price(args: ParsedArgs): Promise<void> {
	const pair = requireArg(args.positional, 0, "pair");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	const spin = spinner("Fetching prices...");
	spin.start();

	// Get oracle prices
	const oraclePrices = await getOraclePrices();
	const baseSymbol = market.tokens[0]?.symbol || "";
	const oraclePrice = oraclePrices.find(
		(p) => p.symbol.toUpperCase() === baseSymbol.toUpperCase(),
	);

	let markPrice: bigint | null = null;
	let lastTradePrice: bigint | null = null;

	if (market.isPerp) {
		const marketId = Number.parseInt(market.pairId, 10);
		try {
			[markPrice, lastTradePrice] = await Promise.all([
				getMarkPrice(marketId),
				getLastTradePrice(marketId),
			]);
		} catch {
			// Ignore errors
		}
	}

	spin.stop("");

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					pair: market.value,
					oraclePrice: oraclePrice?.price.toString(),
					markPrice: markPrice?.toString(),
					lastTradePrice: lastTradePrice?.toString(),
				},
				null,
				2,
			),
		);
		return;
	}

	console.log(bold(`\n💰 ${market.value} Prices\n`));

	const data: Record<string, string> = {};

	if (oraclePrice) {
		data["Oracle Price"] =
			`$${formatAmount(oraclePrice.price, PRICE_DECIMALS, 2)}`;
	}

	if (markPrice) {
		data["Mark Price"] = `$${formatAmount(markPrice, PRICE_DECIMALS, 2)}`;
	}

	if (lastTradePrice) {
		data["Last Trade"] = `$${formatAmount(lastTradePrice, PRICE_DECIMALS, 2)}`;
	}

	if (Object.keys(data).length === 0) {
		data.Status = "Price data unavailable";
	}

	console.log(keyValue(data, 2));
	console.log();
}

/**
 * Display orderbook (placeholder)
 */
export async function orderbook(args: ParsedArgs): Promise<void> {
	const pair = requireArg(args.positional, 0, "pair");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	console.log(bold(`\n📒 ${market.value} Orderbook\n`));
	console.log(dim("  Orderbook data requires WebSocket connection."));
	console.log(dim("  This feature will be available in a future update."));
	console.log();
}

/**
 * Display recent trades (placeholder)
 */
export async function trades(args: ParsedArgs): Promise<void> {
	const pair = requireArg(args.positional, 0, "pair");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	console.log(bold(`\n📜 ${market.value} Recent Trades\n`));
	console.log(dim("  Trade history requires indexer integration."));
	console.log(dim("  This feature will be available in a future update."));
	console.log();
}

/**
 * Display funding rate history (perp only)
 */
export async function funding(args: ParsedArgs): Promise<void> {
	const pair = requireArg(args.positional, 0, "pair");
	const market = findMarket(pair);

	if (!market) {
		throw new Error(`Market not found: ${pair}`);
	}

	if (!market.isPerp) {
		throw new Error("Funding rates are only available for perpetual markets");
	}

	const marketId = Number.parseInt(market.pairId, 10);

	const spin = spinner("Fetching funding data...");
	spin.start();

	let perpMarket: Awaited<ReturnType<typeof getPerpMarket>> = null;
	try {
		perpMarket = await getPerpMarket(marketId);
	} catch {
		// Ignore
	}
	spin.stop("");

	if (args.flags.json) {
		console.log(JSON.stringify({ market: market.value, perpMarket }, null, 2));
		return;
	}

	console.log(bold(`\n💸 ${market.value} Funding\n`));

	if (perpMarket) {
		const fundingRate = Number(perpMarket.fundingRate) / 1e6;
		const annualized = fundingRate * 365 * 24;

		console.log(
			keyValue(
				{
					"Current Rate": `${formatPercent(fundingRate * 100, true)} / 8h`,
					Annualized: formatPercent(annualized, true),
					"Open Interest": formatAmount(perpMarket.openInterest, 18, 2),
					"Long Positions": perpMarket.longOpenPosNum.toString(),
					"Short Positions": perpMarket.shortOpenPosNum.toString(),
				},
				2,
			),
		);
	} else {
		console.log(dim("  Funding data unavailable."));
	}

	console.log();
}
