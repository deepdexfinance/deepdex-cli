/**
 * Quota commands - Account quota management
 */

import { consola } from "consola";
import type { Address } from "viem";
import { network } from "../../abis/config.ts";
import {
	addQuota,
	getAccountQuota,
	getPublicClient,
} from "../../services/client.ts";
import {
	getStoredAddress,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { dim, truncateAddress } from "../../utils/format.ts";
import { confirm, getPassword, keyValue, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { optionalArg, requireArg } from "../parser.ts";

// ============================================================================
// Commands
// ============================================================================

/**
 * Display quota information for an account
 */
export async function info(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const accountAddress = optionalArg(args.positional, 0);
	const account = accountAddress
		? (accountAddress as Address)
		: getStoredAddress()!;

	consola.start("Fetching quota information...");

	try {
		const quotaInfo = await getAccountQuota(account);

		if (args.flags.json) {
			console.log(
				JSON.stringify(
					{
						account,
						quota: quotaInfo.quota,
						nonce: quotaInfo.nonce.toString(),
						exists: quotaInfo.isExist,
					},
					null,
					2,
				),
			);
			return;
		}

		console.log();
		consola.box({
			title: "📊 Account Quota",
			message: `Account: ${truncateAddress(account)}`,
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
					Address: truncateAddress(account),
					"Quota Amount": quotaInfo.quota.toString(),
					Nonce: quotaInfo.nonce.toString(),
					"Account Exists": quotaInfo.isExist ? "Yes" : "No",
				},
				2,
			),
		);

		console.log();
	} catch (error) {
		consola.error(`Failed to fetch quota info: ${(error as Error).message}`);
	}
}

/**
 * Add quota to an account
 */
export async function add(args: ParsedArgs): Promise<void> {
	ensureWallet();
	await ensureUnlocked();

	const accountAddress = requireArg(args.positional, 0, "account address");
	const quotaAmount = requireArg(args.positional, 1, "quota amount");

	// Validate address format
	if (!accountAddress.startsWith("0x") || accountAddress.length !== 42) {
		throw new Error(
			"Invalid address format. Expected 0x followed by 40 hex characters.",
		);
	}

	// Parse quota amount
	let quota: number;
	try {
		quota = Number.parseInt(quotaAmount, 10);
		if (Number.isNaN(quota) || quota < 0) {
			throw new Error("Quota must be a non-negative number");
		}
	} catch {
		throw new Error("Invalid quota amount. Must be a valid number.");
	}

	console.log();
	consola.box({
		title: "➕ Add Quota",
		message: `Adding ${quota} quota to ${truncateAddress(accountAddress)}`,
		style: {
			padding: 1,
			borderColor: "green",
			borderStyle: "rounded",
		},
	});

	// Confirm if not --yes
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Add this quota?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	consola.start("Adding quota on-chain...");

	try {
		const hash = await addQuota(accountAddress as Address, quota);
		const client = getPublicClient();
		await client.waitForTransactionReceipt({ hash });

		console.log();
		consola.success(
			`Added ${quota} quota to ${truncateAddress(accountAddress)}`,
		);
		const explorerUrl = `${network.explorer}/tx/${hash}`;
		console.log(dim(`  Transaction: ${explorerUrl}`));
		console.log();
	} catch (error) {
		consola.error(`Failed to add quota: ${(error as Error).message}`);
	}
}

/**
 * Check quota information for active wallet
 */
export async function check(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const account = getStoredAddress()!;

	consola.start("Checking quota...");

	try {
		const quotaInfo = await getAccountQuota(account);

		if (args.flags.json) {
			console.log(
				JSON.stringify(
					{
						account,
						quota: quotaInfo.quota,
						available: quotaInfo.quota > 0,
					},
					null,
					2,
				),
			);
			return;
		}

		console.log();

		if (!quotaInfo.isExist) {
			consola.warn("Account does not exist on system");
			console.log();
			return;
		}

		if (quotaInfo.quota > 0) {
			consola.success(`Account has ${quotaInfo.quota} quota available`);
		} else {
			consola.warn("Account has no quota available");
		}

		console.log();
	} catch (error) {
		consola.error(`Failed to check quota: ${(error as Error).message}`);
	}
}

/**
 * List quota usage statistics
 */
export async function stats(args: ParsedArgs): Promise<void> {
	ensureWallet();

	const account = getStoredAddress()!;

	consola.start("Fetching quota statistics...");

	try {
		const quotaInfo = await getAccountQuota(account);

		if (args.flags.json) {
			console.log(
				JSON.stringify(
					{
						account,
						quota: quotaInfo.quota,
						nonce: quotaInfo.nonce.toString(),
						status: quotaInfo.isExist ? "active" : "inactive",
					},
					null,
					2,
				),
			);
			return;
		}

		console.log();
		consola.box({
			title: "📈 Quota Statistics",
			message: `Wallet: ${truncateAddress(account)}`,
			style: {
				padding: 1,
				borderColor: "blue",
				borderStyle: "rounded",
			},
		});

		console.log();

		const tableData = [
			{
				Metric: "Total Quota",
				Value: quotaInfo.quota.toString(),
			},
			{
				Metric: "Account Nonce",
				Value: quotaInfo.nonce.toString(),
			},
			{
				Metric: "Account Status",
				Value: quotaInfo.isExist ? "Active" : "Inactive",
			},
			{
				Metric: "Address",
				Value: truncateAddress(account),
			},
		];

		console.log(
			table(
				[
					{ header: "Metric", key: "Metric" },
					{ header: "Value", key: "Value", align: "right" },
				],
				tableData,
			),
		);

		console.log();
	} catch (error) {
		consola.error(
			`Failed to fetch quota statistics: ${(error as Error).message}`,
		);
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
