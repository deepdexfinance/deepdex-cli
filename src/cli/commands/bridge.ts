/**
 * Bridge commands - Cross-chain deposit/withdraw operations
 */

import { consola } from "consola";
import type { Address } from "viem";
import { network } from "../../abis/config.ts";
import {
	BRIDGE_TOKEN_IDS,
	BridgeApi,
	CHAIN_IDS,
	generateBridgeSalt,
	getSupportedChains,
	getTokenId,
	isChainSupported,
	type SupportedChain,
} from "../../services/bridge.ts";
import { SOLANA_BRIDGE_CONFIG, SolanaApi } from "../../services/solana.ts";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
import { dim, formatAmount, truncateAddress } from "../../utils/format.ts";
import { confirm, keyValue, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, requireArg } from "../parser.ts";

// ============================================================================
// Commands
// ============================================================================

/**
 * Display supported chains
 */
export async function chains(args: ParsedArgs): Promise<void> {
	const chainList = [
		{
			Chain: "sepolia",
			Name: "Ethereum Sepolia Testnet",
			ChainID: CHAIN_IDS.SEPOLIA.toString(),
			Type: "EVM",
		},
		{
			Chain: "solana",
			Name: "Solana Devnet",
			ChainID: CHAIN_IDS.SOLANA_DEVNET.toString(),
			Type: "Solana",
		},
	];

	if (args.flags.json) {
		console.log(JSON.stringify(chainList, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "🌉 Supported Bridge Chains",
		message: "Cross-chain deposit and withdrawal",
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});
	console.log();

	console.log(
		table(
			[
				{ header: "Chain", key: "Chain" },
				{ header: "Network Name", key: "Name" },
				{ header: "Chain ID", key: "ChainID", align: "right" },
				{ header: "Type", key: "Type" },
			],
			chainList,
		),
	);
	console.log();
}

/**
 * Estimate bridge fees
 */
export async function fees(args: ParsedArgs): Promise<void> {
	const chain = requireArg(args.positional, 0, "chain");
	const amount = requireArg(args.positional, 1, "amount");
	const token = requireArg(args.positional, 2, "token");

	if (!isChainSupported(chain)) {
		throw new Error(
			`Unsupported chain: ${chain}. Supported: ${getSupportedChains().join(", ")}`,
		);
	}

	const tokenId = getTokenId(token);
	if (tokenId === null) {
		throw new Error(
			`Unsupported token: ${token}. Supported: ${Object.keys(BRIDGE_TOKEN_IDS).join(", ")}`,
		);
	}

	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;

	consola.start(`Estimating bridge fees for ${amount} ${token} to ${chain}...`);

	try {
		const bridgeApi = new BridgeApi(chain as SupportedChain);

		// Parse amount with token decimals
		const tokenConfig = Object.values(network.tokens).find(
			(t) => t.symbol.toUpperCase() === token.toUpperCase(),
		);
		const decimals = tokenConfig?.decimals ?? 18;
		const amountBigInt = BigInt(
			Math.floor(Number.parseFloat(amount) * 10 ** decimals),
		);

		const fee = await bridgeApi.getBridgeFee({
			tokenId,
			dstChainId:
				chain === "sepolia" ? CHAIN_IDS.SEPOLIA : CHAIN_IDS.SOLANA_DEVNET,
			amount: amountBigInt,
			dstRecipient: address as Address,
		});

		if (args.flags.json) {
			console.log(
				JSON.stringify(
					{
						chain,
						amount,
						token,
						fee: fee.toString(),
						feeFormatted: formatAmount(fee, 18, 6),
					},
					null,
					2,
				),
			);
			return;
		}

		console.log();
		consola.box({
			title: "💰 Bridge Fee Estimate",
			message: `${amount} ${token} → ${chain}`,
			style: {
				padding: 1,
				borderColor: "green",
				borderStyle: "rounded",
			},
		});
		console.log();

		console.log(
			keyValue(
				{
					Chain: chain,
					Token: token,
					Amount: `${amount} ${token}`,
					"Estimated Fee": `${formatAmount(fee, 18, 6)} ETH`,
				},
				2,
			),
		);
		console.log();
	} catch (error) {
		consola.error("Failed to estimate bridge fees:", error);
		throw error;
	}
}

/**
 * Deposit from external chain to DeepDEX
 */
export async function deposit(args: ParsedArgs): Promise<void> {
	const chain = requireArg(args.positional, 0, "chain");
	const amount = requireArg(args.positional, 1, "amount");
	const token = requireArg(args.positional, 2, "token");
	const toAddress = getFlag(args.raw, "to") as string | undefined;

	if (!isChainSupported(chain)) {
		throw new Error(
			`Unsupported chain: ${chain}. Supported: ${getSupportedChains().join(", ")}`,
		);
	}

	const tokenId = getTokenId(token);
	if (tokenId === null) {
		throw new Error(
			`Unsupported token: ${token}. Supported: ${Object.keys(BRIDGE_TOKEN_IDS).join(", ")}`,
		);
	}

	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;
	const recipient = toAddress ?? address;

	// Get token decimals
	const tokenConfig = Object.values(network.tokens).find(
		(t) => t.symbol.toUpperCase() === token.toUpperCase(),
	);
	const decimals = tokenConfig?.decimals ?? 18;
	const _amountBigInt = BigInt(
		Math.floor(Number.parseFloat(amount) * 10 ** decimals),
	);

	console.log();
	consola.box({
		title: "🌉 Bridge Deposit",
		message: `${chain} → DeepDEX`,
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
				"Source Chain": chain,
				Token: token,
				Amount: `${amount} ${token}`,
				Recipient: truncateAddress(recipient as `0x${string}`),
			},
			2,
		),
	);
	console.log();

	if (chain === "solana") {
		consola.info("Solana deposit requires signing with your Solana wallet.");
		consola.info("Use the Solana wallet adapter to complete this transaction.");
		console.log();

		// Show transaction details that would be signed
		const _solanaApi = new SolanaApi();
		consola.info(`Bridge Program: ${SOLANA_BRIDGE_CONFIG.bridgeProgram}`);
		consola.info(`Consumer Program: ${SOLANA_BRIDGE_CONFIG.consumerProgram}`);
		console.log();

		consola.warn(
			"Solana wallet signing is not yet implemented in CLI. Use the web interface.",
		);
	} else {
		// EVM chain deposit flow
		consola.info(
			`To deposit from ${chain}, you need to interact with the bridge contract on ${chain}.`,
		);
		consola.info(
			"This requires connecting your wallet to the source chain's bridge contract.",
		);
		console.log();

		if (!args.flags.yes) {
			const confirmed = await confirm("Continue with deposit instructions?");
			if (!confirmed) {
				consola.info("Deposit cancelled.");
				return;
			}
		}

		const bridgeApi = new BridgeApi(chain as SupportedChain);
		try {
			const tokenInfo = await bridgeApi.getTokenInfo(tokenId);
			console.log();
			consola.info("Token Bridge Info:");
			console.log(
				keyValue(
					{
						"Token ID": tokenId.toString(),
						"Token Address": tokenInfo.token,
						"Common Decimals": tokenInfo.commonDecimal.toString(),
						"Is Native": tokenInfo.isNativeAsset ? "Yes" : "No",
					},
					2,
				),
			);
		} catch {
			consola.warn("Could not fetch token info from bridge contract.");
		}

		console.log();
		consola.success(
			"To complete deposit, sign the bridgeOut transaction on the source chain.",
		);
	}

	console.log();
}

/**
 * Withdraw from DeepDEX to external chain
 */
export async function withdraw(args: ParsedArgs): Promise<void> {
	const chain = requireArg(args.positional, 0, "chain");
	const amount = requireArg(args.positional, 1, "amount");
	const token = requireArg(args.positional, 2, "token");
	const toAddress = getFlag(args.raw, "to") as string | undefined;

	if (!isChainSupported(chain)) {
		throw new Error(
			`Unsupported chain: ${chain}. Supported: ${getSupportedChains().join(", ")}`,
		);
	}

	const tokenId = getTokenId(token);
	if (tokenId === null) {
		throw new Error(
			`Unsupported token: ${token}. Supported: ${Object.keys(BRIDGE_TOKEN_IDS).join(", ")}`,
		);
	}

	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const address = getStoredAddress()!;
	const recipient = toAddress ?? address;

	// Get token decimals
	const tokenConfig = Object.values(network.tokens).find(
		(t) => t.symbol.toUpperCase() === token.toUpperCase(),
	);
	const decimals = tokenConfig?.decimals ?? 18;
	const amountBigInt = BigInt(
		Math.floor(Number.parseFloat(amount) * 10 ** decimals),
	);

	console.log();
	consola.box({
		title: "🌉 Bridge Withdrawal",
		message: `DeepDEX → ${chain}`,
		style: {
			padding: 1,
			borderColor: "yellow",
			borderStyle: "rounded",
		},
	});
	console.log();

	console.log(
		keyValue(
			{
				"Destination Chain": chain,
				Token: token,
				Amount: `${amount} ${token}`,
				Recipient: truncateAddress(recipient as `0x${string}`),
			},
			2,
		),
	);
	console.log();

	if (!args.flags.yes) {
		const confirmed = await confirm(`Withdraw ${amount} ${token} to ${chain}?`);
		if (!confirmed) {
			consola.info("Withdrawal cancelled.");
			return;
		}
	}

	consola.start("Processing withdrawal...");

	// Generate salt for the transaction
	const salt = generateBridgeSalt();

	console.log();
	consola.info("Withdrawal Details:");
	console.log(
		keyValue(
			{
				"Token ID": tokenId.toString(),
				"Amount (raw)": amountBigInt.toString(),
				Salt: truncateAddress(salt),
				"Dest Chain ID":
					chain === "sepolia"
						? CHAIN_IDS.SEPOLIA.toString()
						: CHAIN_IDS.SOLANA_DEVNET.toString(),
			},
			2,
		),
	);
	console.log();

	consola.warn(
		"Bridge withdrawal requires signature authorization from DeepDEX.",
	);
	consola.info(
		"Submit the withdrawal request through the DeepDEX API to get authorization.",
	);
	console.log();
}

/**
 * Check bridge transaction status
 */
export async function status(args: ParsedArgs): Promise<void> {
	const txHash = requireArg(args.positional, 0, "txHash");

	consola.start(`Checking bridge transaction status: ${txHash}`);

	// For now, just show the hash - actual status checking would require
	// querying the bridge indexer or both chains
	console.log();
	consola.box({
		title: "🔍 Bridge Transaction Status",
		message: txHash.startsWith("0x")
			? truncateAddress(txHash as `0x${string}`)
			: `${txHash.slice(0, 10)}...`,
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});
	console.log();

	consola.info(
		"Transaction status checking requires connection to bridge indexer.",
	);
	consola.info(
		"Check the explorer on both source and destination chains for confirmation.",
	);
	console.log();
}

/**
 * Show bridge help
 */
export async function help(): Promise<void> {
	console.log();
	consola.box({
		title: "🌉 Bridge Commands",
		message: "Cross-chain deposit and withdrawal",
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});
	console.log();

	console.log(dim("  Usage:"));
	console.log("    deepdex bridge <command> [options]");
	console.log();

	console.log(dim("  Commands:"));
	console.log(
		"    chains                                   List supported chains",
	);
	console.log(
		"    fees <chain> <amount> <token>            Estimate bridge fees",
	);
	console.log(
		"    deposit <chain> <amount> <token>         Deposit from external chain",
	);
	console.log(
		"    withdraw <chain> <amount> <token>        Withdraw to external chain",
	);
	console.log(
		"    status <txHash>                          Check transaction status",
	);
	console.log();

	console.log(dim("  Options:"));
	console.log("    --to <address>    Recipient address (defaults to wallet)");
	console.log("    --yes             Skip confirmation prompts");
	console.log("    --json            Output in JSON format");
	console.log();

	console.log(dim("  Examples:"));
	console.log("    deepdex bridge chains");
	console.log("    deepdex bridge fees sepolia 100 USDC");
	console.log("    deepdex bridge deposit sepolia 100 USDC");
	console.log("    deepdex bridge withdraw solana 1 SOL --to ABC123...");
	console.log();

	console.log(dim("  Supported Chains:"));
	console.log("    sepolia           Ethereum Sepolia Testnet");
	console.log("    solana            Solana Devnet");
	console.log();

	console.log(dim("  Supported Tokens:"));
	console.log(`    ${Object.keys(BRIDGE_TOKEN_IDS).join(", ")}`);
	console.log();
}
