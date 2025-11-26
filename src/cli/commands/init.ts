/**
 * Init command - Setup wizard for DeepDex CLI
 */

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
	info,
	success,
	truncateAddress,
	warning,
} from "../../utils/format.ts";
import {
	confirm,
	prompt,
	promptPassword,
	select,
	spinner,
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
		console.log(warning("Wallet already exists!"));
		console.log(`  Address: ${truncateAddress(address!)}`);
		console.log();

		const overwrite = await confirm(
			"Do you want to create a new wallet?",
			false,
		);
		if (!overwrite) {
			console.log(info("Keeping existing wallet."));
			return;
		}
	}

	ensureDirectories();

	// Choose setup method
	console.log(bold("\n🔐 Wallet Setup\n"));

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
		const password = await promptPassword(
			"Create a password to encrypt your wallet: ",
		);
		const confirmPwd = await promptPassword("Confirm password: ");

		if (password !== confirmPwd) {
			throw new Error("Passwords do not match");
		}

		if (password.length < 8) {
			throw new Error("Password must be at least 8 characters");
		}

		const spin = spinner("Importing wallet...");
		spin.start();

		address = await importWallet(privateKey, password);

		spin.stop(success("Wallet imported successfully!"));
	} else {
		// Create new wallet
		console.log();
		const password = await promptPassword(
			"Create a password to encrypt your wallet: ",
		);
		const confirmPwd = await promptPassword("Confirm password: ");

		if (password !== confirmPwd) {
			throw new Error("Passwords do not match");
		}

		if (password.length < 8) {
			throw new Error("Password must be at least 8 characters");
		}

		const spin = spinner("Creating new wallet...");
		spin.start();

		address = await createWallet(password);

		spin.stop(success("Wallet created successfully!"));
	}

	// Display wallet info
	console.log();
	console.log(bold("Your Wallet"));
	console.log(`  Address: ${COLORS.info}${address}${COLORS.reset}`);

	// Check balance
	try {
		const balance = await getBalance(address as `0x${string}`);
		console.log(`  Balance: ${formatAmount(balance, 18)} ETH`);

		if (balance === 0n) {
			console.log();
			console.log(warning("Your wallet has no ETH for gas fees."));
			console.log(dim("  Send some testnet ETH to this address, or use:"));
			console.log(dim("  $ deepdex faucet --token ETH"));
		}
	} catch {
		console.log(`  Balance: ${dim("Unable to fetch")}`);
	}

	// Save default config
	const config = loadConfig();
	saveConfig(config);

	// Next steps
	console.log();
	console.log(bold("📋 Next Steps"));
	console.log(`${dim("  1. Get testnet tokens:        ")}deepdex faucet`);
	console.log(
		`${dim("  2. Create a subaccount:       ")}deepdex account create`,
	);
	console.log(
		dim("  3. Deposit collateral:        ") +
			"deepdex account deposit 1000 USDC",
	);
	console.log(
		`${dim("  4. Start trading:             ")}deepdex spot buy ETH/USDC 0.1`,
	);
	console.log();
	console.log(info("Run 'deepdex help' for all available commands."));
}

/**
 * Quickstart wizard - streamlined setup flow
 */
export async function quickstart(args: ParsedArgs): Promise<void> {
	console.log(BANNER);
	console.log(bold("\n🚀 Quick Start Wizard\n"));
	console.log(dim("This wizard will help you set up everything in one go.\n"));

	// Step 1: Wallet
	console.log(bold("Step 1: Wallet Setup"));
	if (!walletExists()) {
		await run(args);
	} else {
		const address = getStoredAddress();
		console.log(
			success(`Wallet already configured: ${truncateAddress(address!)}`),
		);

		// Unlock wallet
		const password = await promptPassword("Enter your wallet password: ");
		await unlockWallet(password);
		console.log(success("Wallet unlocked"));
	}

	// Step 2: Faucet
	console.log();
	console.log(bold("Step 2: Get Testnet Tokens"));
	const wantFaucet = await confirm(
		"Would you like to mint testnet USDC?",
		true,
	);
	if (wantFaucet) {
		console.log(info("Minting testnet USDC..."));
		console.log(dim("(In production, this would call the faucet contract)"));
		console.log(success("Received 10,000 USDC"));
	}

	// Step 3: Create Account
	console.log();
	console.log(bold("Step 3: Create Subaccount"));
	const accountName = await prompt(
		"Enter a name for your subaccount (default: main): ",
	);
	const name = accountName || "main";
	console.log(info(`Creating subaccount '${name}'...`));
	console.log(
		dim("(In production, this would create the subaccount on-chain)"),
	);
	console.log(success(`Subaccount '${name}' created`));

	// Step 4: Deposit
	console.log();
	console.log(bold("Step 4: Deposit Collateral"));
	const depositAmount = await prompt(
		"How much USDC to deposit? (default: 1000): ",
	);
	const amount = depositAmount || "1000";
	console.log(info(`Depositing ${amount} USDC...`));
	console.log(dim("(In production, this would deposit to the subaccount)"));
	console.log(success(`${amount} USDC deposited to '${name}'`));

	// Done
	console.log();
	console.log("═".repeat(60));
	console.log(bold("\n✨ Setup Complete!\n"));
	console.log("You're ready to start trading. Try these commands:");
	console.log();
	console.log(dim("  Check your balance:"));
	console.log("  $ deepdex balance");
	console.log();
	console.log(dim("  View markets:"));
	console.log("  $ deepdex market list");
	console.log();
	console.log(dim("  Place your first trade:"));
	console.log("  $ deepdex spot buy ETH/USDC 0.1");
	console.log();
}
