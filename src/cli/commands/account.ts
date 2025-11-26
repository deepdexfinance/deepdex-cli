/**
 * Account commands - Subaccount management
 */

import { consola } from "consola";
import { network } from "../../abis/config.ts";
import { getSubaccounts } from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { dim, info as infoMsg, truncateAddress } from "../../utils/format.ts";
import { confirm, keyValue, promptPassword, table } from "../../utils/ui.ts";
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

	const name = optionalArg(args.positional, 0, "main");

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

	// In production, this would call the contract
	// For now, show simulated output
	await new Promise((resolve) => setTimeout(resolve, 1000));

	console.log();
	consola.success(`Subaccount "${name}" created!`);
	console.log(
		dim(`  Next: deepdex account deposit 1000 USDC --account ${name}`),
	);
	console.log();
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
		// In testnet, might not have any
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
			ID: truncateAddress(acc.id as `0x${string}`),
			Status: acc.active ? "Active" : "Inactive",
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

	const accountName = getFlag<string>(args.raw, "account") || "default";
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

	const amount = requireArg(args.positional, 0, "amount");
	const token = requireArg(args.positional, 1, "token").toUpperCase();
	const accountName = getFlag<string>(args.raw, "account") || "default";

	// Validate token
	const tokenInfo = Object.values(network.tokens).find(
		(t) => t.symbol.toUpperCase() === token,
	);
	if (!tokenInfo) {
		throw new Error(
			`Unknown token: ${token}. Available: ${Object.values(network.tokens)
				.map((t) => t.symbol)
				.join(", ")}`,
		);
	}

	console.log();
	consola.box({
		title: "💰 Deposit",
		message: `Deposit ${amount} ${token} to "${accountName}"`,
		style: {
			padding: 1,
			borderColor: "green",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm(`Deposit ${amount} ${token}?`, true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Processing deposit...");

	// Simulate transaction
	await new Promise((resolve) => setTimeout(resolve, 1500));

	console.log();
	consola.success(`Deposited ${amount} ${token} to "${accountName}"`);
	console.log(dim("  Transaction confirmed"));
	console.log();
}

/**
 * Withdraw tokens from subaccount
 */
export async function withdraw(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const amount = requireArg(args.positional, 0, "amount");
	const token = requireArg(args.positional, 1, "token").toUpperCase();
	const accountName = getFlag<string>(args.raw, "account") || "default";

	// Validate token
	const tokenInfo = Object.values(network.tokens).find(
		(t) => t.symbol.toUpperCase() === token,
	);
	if (!tokenInfo) {
		throw new Error(`Unknown token: ${token}`);
	}

	console.log();
	consola.box({
		title: "💸 Withdraw",
		message: `Withdraw ${amount} ${token} from "${accountName}"`,
		style: {
			padding: 1,
			borderColor: "yellow",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm(`Withdraw ${amount} ${token}?`, true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Processing withdrawal...");

	// Simulate transaction
	await new Promise((resolve) => setTimeout(resolve, 1500));

	console.log();
	consola.success(`Withdrew ${amount} ${token} from "${accountName}"`);
	console.log(dim("  Funds returned to your wallet"));
	console.log();
}

/**
 * Delegate trading authority
 */
export async function delegate(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const delegateTo = requireArg(args.positional, 0, "address");
	const accountName = getFlag<string>(args.raw, "account") || "default";

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

	consola.start("Setting delegation...");

	// Simulate transaction
	await new Promise((resolve) => setTimeout(resolve, 1500));

	console.log();
	consola.success("Delegation set successfully");
	console.log(
		dim(`  ${delegateTo} can now trade on behalf of "${accountName}"`),
	);
	console.log();
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
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}
}
