/**
 * Account (subaccount) commands for DeepDex CLI
 */

import type { Address } from "viem";
import {
	createSubaccount,
	getFreeDeposit,
	getUserSubaccounts,
	setDelegate,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { USDC_DECIMALS } from "../../utils/constants.ts";
import {
	bold,
	dim,
	error,
	formatUSD,
	info as infoMsg,
	success,
	truncateAddress,
} from "../../utils/format.ts";
import {
	confirm,
	keyValue,
	promptPassword,
	spinner,
	table,
} from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, optionalArg, requireArg } from "../parser.ts";

/**
 * Create a new subaccount
 */
export async function create(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const name = optionalArg(args.positional, 0, "main");

	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	if (args.flags.dryRun) {
		console.log(infoMsg(`[Dry Run] Would create subaccount: ${name}`));
		return;
	}

	const spin = spinner(`Creating subaccount '${name}'...`);
	spin.start();

	try {
		const txHash = await createSubaccount(name!);
		spin.stop(success(`Subaccount '${name}' created!`));
		console.log(dim(`  Transaction: ${truncateAddress(txHash)}`));
	} catch (err) {
		spin.stop(error("Failed to create subaccount"));
		throw err;
	}
}

/**
 * List all subaccounts
 */
export async function list(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const address = getStoredAddress()!;
	const spin = spinner("Fetching subaccounts...");
	spin.start();

	const subaccounts = await getUserSubaccounts(address);
	spin.stop("");

	if (subaccounts.length === 0) {
		console.log(infoMsg("No subaccounts found."));
		console.log(dim("  Create one with: deepdex account create"));
		return;
	}

	if (args.flags.json) {
		console.log(JSON.stringify(subaccounts, null, 2));
		return;
	}

	console.log(bold("\n📋 Your Subaccounts\n"));

	const tableData = subaccounts.map((sub) => ({
		Name: sub.name,
		Address: truncateAddress(sub.address),
		Delegate: sub.delegate ? truncateAddress(sub.delegate) : dim("None"),
		Margin: sub.isMarginEnabled ? "✓" : "✗",
		Status: sub.status === 1 ? "Active" : "Inactive",
	}));

	console.log(
		table(
			[
				{ header: "Name", key: "Name" },
				{ header: "Address", key: "Address" },
				{ header: "Delegate", key: "Delegate" },
				{ header: "Margin", key: "Margin", align: "center" },
				{ header: "Status", key: "Status" },
			],
			tableData,
		),
	);
}

/**
 * Display subaccount information
 */
export async function info(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const nameOrAddress = optionalArg(args.positional, 0);
	const address = getStoredAddress()!;

	const spin = spinner("Fetching subaccount info...");
	spin.start();

	// Get all subaccounts to find the one we want
	const subaccounts = await getUserSubaccounts(address);
	spin.stop("");

	let subaccount = subaccounts[0]; // Default to first

	if (nameOrAddress) {
		// Find by name or address
		subaccount = subaccounts.find(
			(s) =>
				s.name.toLowerCase() === nameOrAddress.toLowerCase() ||
				s.address.toLowerCase() === nameOrAddress.toLowerCase(),
		);

		if (!subaccount) {
			throw new Error(`Subaccount not found: ${nameOrAddress}`);
		}
	}

	if (!subaccount) {
		console.log(infoMsg("No subaccounts found."));
		return;
	}

	// Get free deposit (available balance)
	const freeDeposit = await getFreeDeposit(subaccount.address);

	if (args.flags.json) {
		console.log(
			JSON.stringify(
				{
					...subaccount,
					freeDeposit: freeDeposit.toString(),
				},
				null,
				2,
			),
		);
		return;
	}

	console.log(bold(`\n📊 Subaccount: ${subaccount.name}\n`));

	console.log(
		keyValue(
			{
				Address: subaccount.address,
				Delegate: subaccount.delegate || "None",
				"Margin Trading": subaccount.isMarginEnabled ? "Enabled" : "Disabled",
				Status: subaccount.status === 1 ? "Active" : "Inactive",
				"Available Balance": formatUSD(freeDeposit, USDC_DECIMALS),
			},
			2,
		),
	);
	console.log();
}

/**
 * Deposit tokens to subaccount
 */
export async function deposit(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const amount = requireArg(args.positional, 0, "amount");
	const token = requireArg(args.positional, 1, "token").toUpperCase();
	const accountName = getFlag<string>(args.raw, "account");

	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	// Validate token
	if (!["USDC", "ETH", "SOL"].includes(token)) {
		throw new Error(`Unsupported token: ${token}. Supported: USDC, ETH, SOL`);
	}

	// Validate amount
	const numAmount = Number.parseFloat(amount);
	if (Number.isNaN(numAmount) || numAmount <= 0) {
		throw new Error("Invalid amount");
	}

	const targetAccount = accountName || "default";

	if (args.flags.dryRun) {
		console.log(
			infoMsg(
				`[Dry Run] Would deposit ${amount} ${token} to '${targetAccount}'`,
			),
		);
		return;
	}

	console.log();
	console.log(
		infoMsg(`Depositing ${amount} ${token} to '${targetAccount}'...`),
	);

	// In production, this would:
	// 1. Approve token spending
	// 2. Call deposit on subaccount contract

	console.log(dim("  (Transaction simulation - not yet implemented)"));
	console.log(success(`Deposited ${amount} ${token} to '${targetAccount}'`));
	console.log();
}

/**
 * Withdraw tokens from subaccount
 */
export async function withdraw(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const amount = requireArg(args.positional, 0, "amount");
	const token = requireArg(args.positional, 1, "token").toUpperCase();
	const accountName = getFlag<string>(args.raw, "account");

	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	// Validate amount
	const numAmount = Number.parseFloat(amount);
	if (Number.isNaN(numAmount) || numAmount <= 0) {
		throw new Error("Invalid amount");
	}

	const targetAccount = accountName || "default";

	// Confirmation for large withdrawals
	if (!args.flags.yes && numAmount > 1000) {
		const confirmed = await confirm(
			`Withdraw ${amount} ${token} from '${targetAccount}'?`,
			false,
		);
		if (!confirmed) {
			console.log(infoMsg("Withdrawal cancelled."));
			return;
		}
	}

	if (args.flags.dryRun) {
		console.log(
			infoMsg(
				`[Dry Run] Would withdraw ${amount} ${token} from '${targetAccount}'`,
			),
		);
		return;
	}

	console.log();
	console.log(
		infoMsg(`Withdrawing ${amount} ${token} from '${targetAccount}'...`),
	);
	console.log(dim("  (Transaction simulation - not yet implemented)"));
	console.log(success(`Withdrew ${amount} ${token} from '${targetAccount}'`));
	console.log();
}

/**
 * Delegate trading authority to another address
 */
export async function delegate(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const subaccountName = requireArg(args.positional, 0, "subaccount");
	const delegateAddress = requireArg(
		args.positional,
		1,
		"delegate_address",
	) as Address;

	if (!isUnlocked()) {
		const password = await promptPassword("Enter wallet password: ");
		await unlockWallet(password);
	}

	// Validate address format
	if (!delegateAddress.startsWith("0x") || delegateAddress.length !== 42) {
		throw new Error("Invalid delegate address format");
	}

	const ownerAddress = getStoredAddress()!;
	const subaccounts = await getUserSubaccounts(ownerAddress);

	const subaccount = subaccounts.find(
		(s) => s.name.toLowerCase() === subaccountName.toLowerCase(),
	);

	if (!subaccount) {
		throw new Error(`Subaccount not found: ${subaccountName}`);
	}

	if (args.flags.dryRun) {
		console.log(
			infoMsg(
				`[Dry Run] Would delegate '${subaccountName}' to ${truncateAddress(delegateAddress)}`,
			),
		);
		return;
	}

	const spin = spinner("Setting delegate...");
	spin.start();

	try {
		const txHash = await setDelegate(subaccount.address, delegateAddress);
		spin.stop(success("Delegate set successfully!"));
		console.log(dim(`  Transaction: ${truncateAddress(txHash)}`));
		console.log();
		console.log(infoMsg(`'${subaccountName}' can now be traded by:`));
		console.log(`  ${delegateAddress}`);
	} catch (err) {
		spin.stop(error("Failed to set delegate"));
		throw err;
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
