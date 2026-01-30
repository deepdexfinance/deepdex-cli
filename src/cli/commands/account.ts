/**
 * Account commands - Subaccount management
 */

import { consola } from "consola";
import type { Address } from "viem";
import { network } from "../../abis/config.ts";
import {
	createSubaccount,
	depositToSubaccount,
	getPublicClient,
	getSubaccountBalance,
	getSubaccounts,
	getTokenBalance,
	setDelegate,
	withdrawFromSubaccount,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import {
	dim,
	info as infoMsg,
	parseAmountOrPercent,
	truncateAddress,
} from "../../utils/format.ts";
import { confirm, getPassword, keyValue, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, optionalArg, requireArg } from "../parser.ts";

// ============================================================================
// Commands
// ============================================================================

/**
 * Create a new subaccount
 */
export async function create(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const name = optionalArg(args.positional, 0, "main")!;

	console.log();
	consola.box({
		title: "📁 Create Subaccount",
		message: `Creating new subaccount: "${name}"`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	// Confirm if not --yes
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Create this subaccount?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Creating subaccount on-chain...");

	try {
		const hash = await createSubaccount(name);
		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		console.log();
		consola.success(`Subaccount "${name}" created!`);
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log(
			dim(`  Next: deepdex account deposit 1000 USDC --account ${name}`),
		);
		console.log();
	} catch (error) {
		consola.error(`Failed to create subaccount: ${(error as Error).message}`);
	}
}

/**
 * List all subaccounts
 */
export async function list(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const address = getStoredAddress()!;

	consola.start("Fetching subaccounts...");

	let subaccounts: Awaited<ReturnType<typeof getSubaccounts>> = [];
	try {
		subaccounts = await getSubaccounts(address);
	} catch {
		consola.warn("Failed to fetch subaccounts.");
	}

	if (args.flags.json) {
		console.log(JSON.stringify(subaccounts, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📂 Your Subaccounts",
		message: `Wallet: ${truncateAddress(address)}`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (subaccounts.length === 0) {
		consola.info("No subaccounts found.");
		console.log(dim("  Create one with: deepdex account create"));
	} else {
		const tableData = subaccounts.map((acc, i) => ({
			"#": (i + 1).toString(),
			Name: acc.name || `Account ${i + 1}`,
			ID: acc.address,
			Status: "Active",
		}));

		console.log(
			table(
				[
					{ header: "#", key: "#", align: "right" },
					{ header: "Name", key: "Name" },
					{ header: "ID", key: "ID" },
					{ header: "Status", key: "Status" },
				],
				tableData,
			),
		);
	}

	console.log();
}

/**
 * Display subaccount info
 */
export async function info(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const accountName = getFlag<string>(args.raw, "account") || "main";
	const address = getStoredAddress()!;

	consola.start("Fetching account info...");

	// Simulated account info
	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					name: accountName,
					owner: address,
					balance: "0",
					marginUsed: "0",
					freeMargin: "0",
				},
				null,
				2,
			),
		);
		return;
	}

	console.log();
	consola.box({
		title: `📊 Subaccount: ${accountName}`,
		message: `Owner: ${truncateAddress(address)}`,
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
				Balance: "$0.00",
				"Margin Used": "$0.00",
				"Free Margin": "$0.00",
				"Open Positions": "0",
				"Open Orders": "0",
			},
			2,
		),
	);

	console.log();
	console.log(
		infoMsg("Deposit funds with: deepdex account deposit <amount> USDC"),
	);
	console.log();
}

/**
 * Deposit tokens to subaccount
 */
export async function deposit(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const amountStr = requireArg(args.positional, 0, "amount");
	const tokenSymbol = requireArg(args.positional, 1, "token").toUpperCase();
	const accountName = getFlag<string>(args.raw, "account") || "main";

	// Validate token
	const tokenInfo = Object.values(network.tokens).find(
		(t) => t.symbol.toUpperCase() === tokenSymbol,
	);
	if (!tokenInfo) {
		throw new Error(
			`Unknown token: ${tokenSymbol}. Available: ${Object.values(network.tokens)
				.map((t) => t.symbol)
				.join(", ")}`,
		);
	}

	const owner = getStoredAddress()!;
	const subaccounts = await getSubaccounts(owner);
	const subaccount = subaccounts.find((s) => s.name === accountName);

	if (!subaccount) {
		throw new Error(`Subaccount "${accountName}" not found.`);
	}

	// Parse amount (supports percentage like "50%" or "100%")
	let walletBalance: bigint | undefined;
	if (amountStr.endsWith("%")) {
		walletBalance = await getTokenBalance(
			owner as Address,
			tokenInfo.address as Address,
		);
	}

	const parsed = parseAmountOrPercent(
		amountStr,
		tokenInfo.decimals,
		walletBalance,
		tokenSymbol,
	);

	if (parsed.isPercentage) {
		console.log(
			dim(
				`  ${amountStr} of wallet balance = ${parsed.displayAmount} ${tokenSymbol}`,
			),
		);
	}

	console.log();
	consola.box({
		title: "💰 Deposit",
		message: `Deposit ${parsed.displayAmount} ${tokenSymbol} to "${accountName}"`,
		style: {
			padding: 1,
			borderColor: "green",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm(
			`Deposit ${parsed.displayAmount} ${tokenSymbol}?`,
			true,
		);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	try {
		consola.start("Processing deposit...");
		const hash = await depositToSubaccount(
			subaccount.address,
			tokenSymbol,
			parsed.amount,
		);
		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		console.log();
		consola.success(
			`Deposited ${parsed.displayAmount} ${tokenSymbol} to "${accountName}"`,
		);
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log();
	} catch (error) {
		consola.error(`Failed to deposit: ${(error as Error).message}`);
	}
}

/**
 * Withdraw tokens from subaccount
 */
export async function withdraw(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const amountStr = requireArg(args.positional, 0, "amount");
	const token = requireArg(args.positional, 1, "token").toUpperCase();
	const accountName = getFlag<string>(args.raw, "account") || "main";

	// Validate token
	const tokenInfo = Object.values(network.tokens).find(
		(t) => t.symbol.toUpperCase() === token,
	);
	if (!tokenInfo) {
		throw new Error(`Unknown token: ${token}`);
	}

	const owner = getStoredAddress()!;
	const subaccounts = await getSubaccounts(owner);
	const subaccount = subaccounts.find((s) => s.name === accountName);

	if (!subaccount) {
		throw new Error(`Subaccount "${accountName}" not found.`);
	}

	// Parse amount (supports percentage like "50%" or "100%")
	let subaccountBalance: bigint | undefined;
	if (amountStr.endsWith("%")) {
		subaccountBalance = await getSubaccountBalance(subaccount.address, token);
	}

	const parsed = parseAmountOrPercent(
		amountStr,
		tokenInfo.decimals,
		subaccountBalance,
		token,
	);

	if (parsed.isPercentage) {
		console.log(
			dim(
				`  ${amountStr} of subaccount balance = ${parsed.displayAmount} ${token}`,
			),
		);
	}

	console.log();
	consola.box({
		title: "💸 Withdraw",
		message: `Withdraw ${parsed.displayAmount} ${token} from "${accountName}"`,
		style: {
			padding: 1,
			borderColor: "yellow",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm(
			`Withdraw ${parsed.displayAmount} ${token}?`,
			true,
		);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Processing withdrawal...");

	try {
		const hash = await withdrawFromSubaccount(
			subaccount.address,
			token,
			parsed.amount,
		);
		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		console.log();
		consola.success(
			`Withdrew ${parsed.displayAmount} ${token} from "${accountName}"`,
		);
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log(dim("  Funds returned to your wallet"));
		console.log();
	} catch (error) {
		consola.error(`Failed to withdraw: ${(error as Error).message}`);
	}
}

/**
 * Delegate trading authority
 */
export async function delegate(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const delegateTo = requireArg(args.positional, 0, "address");
	const accountName = getFlag<string>(args.raw, "account") || "main";

	// Validate address
	if (!delegateTo.startsWith("0x") || delegateTo.length !== 42) {
		throw new Error("Invalid address format");
	}

	console.log();
	consola.box({
		title: "🔐 Delegate Authority",
		message: `Delegate trading authority for "${accountName}"
To: ${delegateTo}`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	console.log();
	consola.warn("This will allow another address to trade on your behalf.");
	consola.warn("Only delegate to addresses you trust!");

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Proceed with delegation?", false);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	const owner = getStoredAddress()!;
	const subaccounts = await getSubaccounts(owner);
	const subaccount = subaccounts.find((s) => s.name === accountName);

	if (!subaccount) {
		throw new Error(`Subaccount "${accountName}" not found.`);
	}

	consola.start("Setting delegation...");

	try {
		const hash = await setDelegate(subaccount.address, delegateTo as Address);
		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		console.log();
		consola.success("Delegation set successfully");
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log(
			dim(`  ${delegateTo} can now trade on behalf of "${accountName}"`),
		);
		console.log();
	} catch (error) {
		consola.error(`Failed to set delegate: ${(error as Error).message}`);
	}
}

// ============================================================================
// Helpers
// ============================================================================

function ensureWallet(): void {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}
}

async function ensureUnlocked(): Promise<void> {
	if (!isUnlocked()) {
		const password = await getPassword();
		await unlockWallet(password);
	}
}
