/**
 * Init command - Setup wizard for DeepDex CLI
 */

import { consola } from "consola";
import {
	ensureDirectories,
	loadConfig,
	saveConfig,
} from "../../config/index.ts";
import { getBalance } from "../../services/client.ts";
import {
	createWallet,
	getStoredAddress,
	importWallet,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import { BANNER, COLORS } from "../../utils/constants.ts";
import {
	bold,
	dim,
	formatAmount,
	truncateAddress,
} from "../../utils/format.ts";
import {
	confirm,
	getNewPassword,
	getPassword,
	prompt,
	select,
} from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";

/**
 * Initialize the CLI environment
 */
export async function run(_args: ParsedArgs): Promise<void> {
	console.log(BANNER);

	// Check if already initialized
	if (walletExists()) {
		const address = getStoredAddress();
		consola.warn("Wallet already exists!");
		console.log(`  Address: ${truncateAddress(address!)}`);
		console.log();

		const overwrite = await confirm(
			"Do you want to create a new wallet?",
			false,
		);
		if (!overwrite) {
			consola.info("Keeping existing wallet.");
			return;
		}
	}

	ensureDirectories();

	// Choose setup method
	consola.box({
		title: "🔐 Wallet Setup",
		message: "Create or import your trading wallet",
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	const method = await select("How would you like to set up your wallet?", [
		{ value: "new", label: "Create a new wallet" },
		{ value: "import", label: "Import existing private key" },
	]);

	let address: string;

	if (method === "import") {
		// Import existing wallet
		const privateKey = await prompt("Enter your private key: ");

		if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
			throw new Error(
				"Invalid private key format. Expected 0x followed by 64 hex characters.",
			);
		}

		console.log();
		const password = await getNewPassword({
			message: "Create a password to encrypt your wallet: ",
		});

		consola.start("Importing wallet...");
		address = await importWallet(privateKey, password);
		consola.success("Wallet imported successfully!");
	} else {
		// Create new wallet
		console.log();
		const password = await getNewPassword({
			message: "Create a password to encrypt your wallet: ",
		});

		consola.start("Creating new wallet...");
		address = await createWallet(password);
		consola.success("Wallet created successfully!");
	}

	// Display wallet info
	console.log();
	consola.box({
		title: "💼 Your Wallet",
		message: `Address: ${COLORS.info}${address}${COLORS.reset}`,
		style: {
			padding: 1,
			borderColor: "green",
			borderStyle: "rounded",
		},
	});

	// Check balance
	try {
		const balance = await getBalance(address as `0x${string}`);
		console.log(`  Balance: ${formatAmount(balance, 18)} tDGAS`);

		if (balance === 0n) {
			console.log();
			consola.warn("Your wallet has no tDGAS for gas fees.");
			console.log(dim("  Send some testnet tDGAS to this address, or use:"));
			console.log(dim("  $ deepdex faucet --token tDGAS"));
		}
	} catch {
		console.log(`  Balance: ${dim("Unable to fetch")}`);
	}

	// Save default config
	const config = loadConfig();
	saveConfig(config);

	// Next steps
	console.log();
	consola.box({
		title: "📋 Next Steps",
		message: `1. Get testnet tokens:     deepdex faucet
2. Create a subaccount:    deepdex account create
3. Deposit collateral:     deepdex account deposit 1000 USDC
4. Start trading:          deepdex spot buy ETH/USDC 0.1`,
		style: {
			padding: 1,
			borderColor: "yellow",
			borderStyle: "rounded",
		},
	});

	console.log();
	consola.info("Run 'deepdex help' for all available commands.");
}

/**
 * Quickstart wizard - streamlined setup flow
 */
export async function quickstart(args: ParsedArgs): Promise<void> {
	console.log(BANNER);

	consola.box({
		title: "🚀 Quick Start Wizard",
		message: "This wizard will help you set up everything in one go.",
		style: {
			padding: 1,
			borderColor: "magenta",
			borderStyle: "rounded",
		},
	});

	console.log();

	// Step 1: Wallet
	consola.info(bold("Step 1: Wallet Setup"));
	if (!walletExists()) {
		await run(args);
	} else {
		const address = getStoredAddress();
		consola.success(`Wallet already configured: ${truncateAddress(address!)}`);

		// Unlock wallet
		const password = await getPassword();
		await unlockWallet(password);
		consola.success("Wallet unlocked");
	}

	// Step 2: Faucet
	console.log();
	consola.info(bold("Step 2: Get Testnet Tokens"));
	const wantFaucet = await confirm(
		"Would you like to mint testnet USDC?",
		true,
	);
	if (wantFaucet) {
		consola.start("Minting testnet USDC...");
		console.log(dim("(In production, this would call the faucet contract)"));
		consola.success("Received 10,000 USDC");
	}

	// Step 3: Create Account
	console.log();
	consola.info(bold("Step 3: Create Subaccount"));
	const accountName = await prompt(
		"Enter a name for your subaccount (default: main): ",
	);
	const name = accountName || "main";
	consola.start(`Creating subaccount '${name}'...`);
	console.log(
		dim("(In production, this would create the subaccount on-chain)"),
	);
	consola.success(`Subaccount '${name}' created`);

	// Step 4: Deposit
	console.log();
	consola.info(bold("Step 4: Deposit Collateral"));
	const depositAmount = await prompt(
		"How much USDC to deposit? (default: 1000): ",
	);
	const amount = depositAmount || "1000";
	consola.start(`Depositing ${amount} USDC...`);
	console.log(dim("(In production, this would deposit to the subaccount)"));
	consola.success(`${amount} USDC deposited to '${name}'`);

	// Done
	console.log();
	consola.box({
		title: "✨ Setup Complete!",
		message: `You're ready to start trading. Try these commands:

Check your balance:
  $ deepdex balance

View markets:
  $ deepdex market list

Place your first trade:
  $ deepdex spot buy ETH/USDC 0.1`,
		style: {
			padding: 1,
			borderColor: "green",
			borderStyle: "rounded",
		},
	});
}
