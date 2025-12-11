/**
 * Process Manager commands - PM2/Docker Compose style process management
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { consola } from "consola";
import { ensureDirectories } from "../../config/index.ts";
import {
	getActiveWalletName,
	isUnlocked,
	unlockWallet,
	walletExists,
} from "../../services/wallet.ts";
import type {
	BotStrategy,
	ProcessState,
	ProcessStatus,
	ProcessStore,
} from "../../types/index.ts";
import {
	PROCESS_LOG_DIR,
	PROCESS_STORE_VERSION,
	PROCESSES_PATH,
} from "../../utils/constants.ts";
import { bold, dim, formatDuration } from "../../utils/format.ts";
import { confirm, getPassword, table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag, optionalArg } from "../parser.ts";

// ============================================================================
// Strategy Definitions (shared with bot.ts)
// ============================================================================

const STRATEGIES: BotStrategy[] = [
	"grid",
	"mm",
	"arbitrage",
	"simple",
	"momentum",
];

// ============================================================================
// Process Store Helpers
// ============================================================================

/**
 * Get the process store, initializing if needed
 */
function getProcessStore(): ProcessStore {
	if (!existsSync(PROCESSES_PATH)) {
		return { version: PROCESS_STORE_VERSION, processes: [] };
	}

	try {
		const data = JSON.parse(readFileSync(PROCESSES_PATH, "utf8"));
		return data as ProcessStore;
	} catch {
		return { version: PROCESS_STORE_VERSION, processes: [] };
	}
}

/**
 * Save the process store
 */
function saveProcessStore(store: ProcessStore): void {
	ensureDirectories();
	writeFileSync(PROCESSES_PATH, JSON.stringify(store, null, 2));
}

/**
 * Check if a process is actually running by PID
 */
function isProcessRunning(pid: number): boolean {
	try {
		// Sending signal 0 checks if process exists without actually signaling
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

/**
 * Clean up stale processes from the store
 */
function cleanupStaleProcesses(): ProcessStore {
	const store = getProcessStore();
	const aliveProcesses = store.processes.filter((p) => isProcessRunning(p.pid));

	if (aliveProcesses.length !== store.processes.length) {
		store.processes = aliveProcesses;
		saveProcessStore(store);
	}

	return store;
}

/**
 * Get process log file path
 */
function getProcessLogPath(name: string): string {
	return `${PROCESS_LOG_DIR}/${name}.log`;
}

/**
 * Validate process name (alphanumeric, dashes, underscores)
 */
function validateProcessName(name: string): void {
	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		throw new Error(
			"Process name must contain only letters, numbers, dashes, and underscores",
		);
	}
	if (name.length > 32) {
		throw new Error("Process name must be 32 characters or less");
	}
}

/**
 * Get all processes with their current status
 */
function getProcessStatuses(): ProcessStatus[] {
	const store = cleanupStaleProcesses();
	return store.processes.map((p) => ({
		...p,
		running: isProcessRunning(p.pid),
		uptime: Date.now() - p.startedAt,
	}));
}

// ============================================================================
// Commands
// ============================================================================

/**
 * List all processes (ps)
 */
export async function ps(args: ParsedArgs): Promise<void> {
	const processes = getProcessStatuses();

	if (args.flags.json) {
		console.log(JSON.stringify(processes, null, 2));
		return;
	}

	console.log();
	consola.box({
		title: "📋 Process Manager",
		message: `${processes.length} process${processes.length !== 1 ? "es" : ""} registered`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	console.log();

	if (processes.length === 0) {
		console.log(dim("  No processes running."));
		console.log(
			dim(
				"  Start one with: deepdex pm start <name> <strategy> --config <path>",
			),
		);
		console.log();
		return;
	}

	const tableData = processes.map((p) => ({
		Name: bold(p.name),
		Strategy: p.strategy,
		PID: String(p.pid),
		Wallet: p.wallet || "-",
		Account: p.account,
		Status: p.running ? "🟢 running" : "🔴 stopped",
		Uptime: p.running ? formatDuration(p.uptime || 0) : "-",
	}));

	console.log(
		table(
			[
				{ header: "Name", key: "Name" },
				{ header: "Strategy", key: "Strategy" },
				{ header: "PID", key: "PID" },
				{ header: "Wallet", key: "Wallet" },
				{ header: "Account", key: "Account" },
				{ header: "Status", key: "Status" },
				{ header: "Uptime", key: "Uptime" },
			],
			tableData,
		),
	);

	console.log();
}

/**
 * Start a new named process
 */
export async function start(args: ParsedArgs): Promise<void> {
	if (!walletExists()) {
		throw new Error("No wallet found. Run 'deepdex init' first.");
	}

	const processName = optionalArg(args.positional, 0);
	const strategyName = optionalArg(args.positional, 1) as
		| BotStrategy
		| undefined;
	const configPath = getFlag<string>(args.raw, "config");

	if (!processName) {
		throw new Error(
			"Process name is required. Usage: deepdex pm start <name> <strategy> --config <path>",
		);
	}

	if (!strategyName) {
		throw new Error(
			"Strategy is required. Usage: deepdex pm start <name> <strategy> --config <path>",
		);
	}

	// Validate inputs
	validateProcessName(processName);

	if (!STRATEGIES.includes(strategyName)) {
		throw new Error(
			`Unknown strategy: ${strategyName}. Available: ${STRATEGIES.join(", ")}`,
		);
	}

	// Check for duplicate name
	const store = cleanupStaleProcesses();
	if (store.processes.find((p) => p.name === processName)) {
		throw new Error(
			`Process '${processName}' already exists. Choose a different name.`,
		);
	}

	// Load config if specified
	let botConfig: Record<string, unknown> = {};
	if (configPath) {
		if (!existsSync(configPath)) {
			throw new Error(`Config file not found: ${configPath}`);
		}
		try {
			botConfig = JSON.parse(readFileSync(configPath, "utf8"));
		} catch {
			throw new Error(`Invalid config file: ${configPath}`);
		}
	}

	// Resolve account: CLI flag > config file > default
	const accountName =
		getFlag<string>(args.raw, "account") ||
		(botConfig.account as string | undefined) ||
		"main";

	// Unlock wallet and capture password for child process
	let walletPassword: string | undefined;
	if (!isUnlocked()) {
		walletPassword = await getPassword({
			flagPassword: getFlag<string>(args.raw, "password"),
		});
		await unlockWallet(walletPassword);
	} else {
		// Wallet already unlocked - try to get password from env or flag for child process
		walletPassword =
			getFlag<string>(args.raw, "password") ||
			process.env.DEEPDEX_WALLET_PASSWORD;

		// If still no password, we need to prompt again for the child process
		if (!walletPassword) {
			consola.info("Wallet is unlocked, but child process needs password.");
			walletPassword = await getPassword({
				message: "Enter wallet password for background process: ",
			});
		}
	}

	console.log();
	consola.box({
		title: "🚀 Starting Process",
		message: `Name: ${processName}
Strategy: ${strategyName}
Account: ${accountName}
Config: ${configPath || "default"}`,
		style: {
			padding: 1,
			borderColor: "cyan",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		consola.warn("The bot will execute real trades with your funds.");
		const confirmed = await confirm("Start the process?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	// Ensure log directory exists
	ensureDirectories();
	if (!existsSync(PROCESS_LOG_DIR)) {
		mkdirSync(PROCESS_LOG_DIR, { recursive: true });
	}

	const logFile = getProcessLogPath(processName);

	// Spawn the process in background
	// Extract inner config if the JSON file has nested structure
	const innerConfig = botConfig.config || botConfig;

	// Build environment for child process
	// Pass the wallet password via env so child can unlock wallet
	const childEnv: Record<string, string | undefined> = {
		...process.env,
		FORCE_COLOR: "1",
		DEEPDEX_PM_PROCESS: "true", // Skip "already running" check for multiple bots
	};

	if (walletPassword) {
		childEnv.DEEPDEX_WALLET_PASSWORD = walletPassword;
	}

	// Create a wrapper script command that runs the bot
	const child = spawn(
		"bun",
		[
			"index.ts",
			"bot",
			"start",
			strategyName,
			"--account",
			accountName,
			...(configPath ? ["--config", configPath] : []),
			"--yes", // Skip confirmation in spawned process
		],
		{
			cwd: process.cwd(),
			detached: true,
			stdio: ["ignore", "pipe", "pipe"],
			env: childEnv,
		},
	);

	// Handle spawn errors
	let spawnError: Error | null = null;
	child.on("error", (err) => {
		spawnError = err;
	});

	// Write output to log file
	const fs = require("node:fs");
	const logStream = fs.createWriteStream(logFile, { flags: "a" });

	// Pipe output to log file but don't keep parent alive
	if (child.stdout) {
		child.stdout.pipe(logStream, { end: false });
		// Access underlying socket's unref if available
		(child.stdout as unknown as { unref?: () => void }).unref?.();
	}
	if (child.stderr) {
		child.stderr.pipe(logStream, { end: false });
		(child.stderr as unknown as { unref?: () => void }).unref?.();
	}

	// Unref everything so parent can exit
	child.unref();
	(logStream as unknown as { unref?: () => void }).unref?.();

	// Save to process store
	const walletName = getActiveWalletName() || "unknown";
	const processState: ProcessState = {
		name: processName,
		pid: child.pid!,
		strategy: strategyName,
		account: accountName,
		wallet: walletName,
		config: innerConfig as Record<string, unknown>,
		startedAt: Date.now(),
		logFile,
	};

	store.processes.push(processState);
	saveProcessStore(store);

	// Wait briefly to catch immediate startup errors
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// Check if process crashed immediately
	if (spawnError) {
		consola.error(`Failed to start process: ${(spawnError as Error).message}`);
		// Remove from store since it failed
		store.processes = store.processes.filter((p) => p.name !== processName);
		saveProcessStore(store);
		process.exit(1);
	}

	// Check if process is still running
	if (!isProcessRunning(child.pid!)) {
		console.log();
		consola.error(
			`Process '${processName}' exited immediately after starting.`,
		);
		consola.info(`Check logs for details: ${logFile}`);

		// Show last few lines of log
		try {
			const logContent = fs.readFileSync(logFile, "utf8");
			const lines = logContent.trim().split("\n").slice(-5);
			if (lines.length > 0) {
				console.log();
				consola.info("Last log lines:");
				for (const line of lines) {
					console.log(dim(`  ${line}`));
				}
			}
		} catch {
			// Ignore log read errors
		}

		// Remove from store since it failed
		store.processes = store.processes.filter((p) => p.name !== processName);
		saveProcessStore(store);
		console.log();
		process.exit(1);
	}

	console.log();
	consola.success(`Process '${processName}' started! (PID: ${child.pid})`);
	console.log(dim(`  Logs: ${logFile}`));
	console.log(dim("  Use 'deepdex pm ps' to view all processes."));
	console.log(dim(`  Use 'deepdex pm stop ${processName}' to stop.`));
	console.log();

	// Force exit since Node may still have references
	process.exit(0);
}

/**
 * Stop a process by name
 */
export async function stop(args: ParsedArgs): Promise<void> {
	const processName = optionalArg(args.positional, 0);

	if (!processName) {
		throw new Error("Process name is required. Usage: deepdex pm stop <name>");
	}

	const store = getProcessStore();
	const processState = store.processes.find((p) => p.name === processName);

	if (!processState) {
		throw new Error(`Process '${processName}' not found.`);
	}

	if (!isProcessRunning(processState.pid)) {
		// Remove from store since it's already dead
		store.processes = store.processes.filter((p) => p.name !== processName);
		saveProcessStore(store);
		consola.info(
			`Process '${processName}' was already stopped. Removed from list.`,
		);
		return;
	}

	console.log();
	consola.box({
		title: "🛑 Stopping Process",
		message: `Name: ${processName}
PID: ${processState.pid}
Strategy: ${processState.strategy}
Uptime: ${formatDuration(Date.now() - processState.startedAt)}`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Stop this process?", true);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	try {
		// Send SIGTERM for graceful shutdown
		process.kill(processState.pid, "SIGTERM");

		// Wait a bit for graceful shutdown
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Check if still running
		if (isProcessRunning(processState.pid)) {
			consola.warn("Process still running, sending SIGKILL...");
			process.kill(processState.pid, "SIGKILL");
		}

		// Remove from store
		store.processes = store.processes.filter((p) => p.name !== processName);
		saveProcessStore(store);

		console.log();
		consola.success(`Process '${processName}' stopped.`);
	} catch (error) {
		consola.error(`Failed to stop process: ${error}`);
	}

	console.log();
}

/**
 * Restart a process
 */
export async function restart(args: ParsedArgs): Promise<void> {
	const processName = optionalArg(args.positional, 0);

	if (!processName) {
		throw new Error(
			"Process name is required. Usage: deepdex pm restart <name>",
		);
	}

	const store = getProcessStore();
	const processState = store.processes.find((p) => p.name === processName);

	if (!processState) {
		throw new Error(`Process '${processName}' not found.`);
	}

	console.log();
	consola.info(`Restarting process '${processName}'...`);

	// Stop the process (force yes to avoid double confirmation)
	const stopArgs = {
		...args,
		positional: [processName],
		flags: { ...args.flags, yes: true },
	};
	await stop(stopArgs);

	// Small delay before restart
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Start with same config
	const startArgs = {
		...args,
		positional: [processName, processState.strategy],
		raw: {
			...args.raw,
			account: processState.account,
		},
		flags: { ...args.flags, yes: true },
	};

	await start(startArgs);

	consola.success(`Process '${processName}' restarted.`);
	console.log();
}

/**
 * View logs for a process
 */
export async function logs(args: ParsedArgs): Promise<void> {
	const processName = optionalArg(args.positional, 0);
	const follow =
		getFlag<boolean>(args.raw, "follow") ||
		getFlag<boolean>(args.raw, "f") ||
		false;
	const lines =
		getFlag<number>(args.raw, "lines") || getFlag<number>(args.raw, "n") || 50;

	if (!processName) {
		throw new Error(
			"Process name is required. Usage: deepdex pm logs <name> [--follow]",
		);
	}

	const logFile = getProcessLogPath(processName);

	if (!existsSync(logFile)) {
		consola.info(`No logs found for process '${processName}'.`);
		console.log(dim(`  Expected log file: ${logFile}`));
		return;
	}

	console.log();
	consola.box({
		title: `📋 Logs: ${processName}`,
		message: `Log file: ${logFile}`,
		style: {
			padding: 1,
			borderColor: "blue",
			borderStyle: "rounded",
		},
	});

	console.log();

	try {
		const content = readFileSync(logFile, "utf8");
		const logLines = content.trim().split("\n");
		const lastLines = logLines.slice(-lines);

		for (const line of lastLines) {
			console.log(dim("  ") + line);
		}

		if (follow) {
			console.log();
			consola.info("Watching for new logs... (Ctrl+C to stop)");

			// Use tail -f in follow mode
			const { spawn } = require("node:child_process");
			const tail = spawn("tail", ["-f", logFile]);
			tail.stdout.on("data", (data: Buffer) => {
				process.stdout.write(data);
			});
			tail.stderr.on("data", (data: Buffer) => {
				process.stderr.write(data);
			});

			// Keep process alive
			await new Promise(() => {});
		}
	} catch (error) {
		consola.error(`Failed to read log file: ${error}`);
	}

	console.log();
}

/**
 * Force kill a process
 */
export async function kill(args: ParsedArgs): Promise<void> {
	const processName = optionalArg(args.positional, 0);

	if (!processName) {
		throw new Error("Process name is required. Usage: deepdex pm kill <name>");
	}

	const store = getProcessStore();
	const processState = store.processes.find((p) => p.name === processName);

	if (!processState) {
		throw new Error(`Process '${processName}' not found.`);
	}

	console.log();
	consola.warn(
		`Force killing process '${processName}' (PID: ${processState.pid})...`,
	);

	try {
		if (isProcessRunning(processState.pid)) {
			process.kill(processState.pid, "SIGKILL");
		}

		// Remove from store
		store.processes = store.processes.filter((p) => p.name !== processName);
		saveProcessStore(store);

		consola.success(`Process '${processName}' killed.`);
	} catch (error) {
		consola.error(`Failed to kill process: ${error}`);
	}

	console.log();
}

/**
 * Stop all processes
 */
export async function stopAll(args: ParsedArgs): Promise<void> {
	const store = cleanupStaleProcesses();

	if (store.processes.length === 0) {
		consola.info("No processes running.");
		return;
	}

	console.log();
	consola.box({
		title: "🛑 Stopping All Processes",
		message: `${store.processes.length} process${store.processes.length !== 1 ? "es" : ""} will be stopped`,
		style: {
			padding: 1,
			borderColor: "red",
			borderStyle: "rounded",
		},
	});

	// Confirm
	if (!args.flags.yes) {
		console.log();
		const confirmed = await confirm("Stop all processes?", false);
		if (!confirmed) {
			consola.info("Cancelled.");
			return;
		}
	}

	for (const processState of store.processes) {
		try {
			if (isProcessRunning(processState.pid)) {
				process.kill(processState.pid, "SIGTERM");
				consola.success(
					`Stopped '${processState.name}' (PID: ${processState.pid})`,
				);
			}
		} catch {
			consola.warn(`Failed to stop '${processState.name}'`);
		}
	}

	// Clear the store
	store.processes = [];
	saveProcessStore(store);

	console.log();
	consola.success("All processes stopped.");
	console.log();
}
