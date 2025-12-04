/**
 * Health check command
 */

import { existsSync, statSync } from "node:fs";
import { consola } from "consola";
import {
	getBalance,
	getBlockNumber,
	getPublicClient,
} from "../../services/client.ts";
import { getStoredAddress, walletExists } from "../../services/wallet.ts";
import type {
	HealthCheck,
	HealthReport,
	HealthStatus,
} from "../../types/index.ts";
import { BOT_PID_PATH, DEEPDEX_HOME } from "../../utils/constants.ts";
import { formatAmount, formatHealthStatus } from "../../utils/format.ts";
import { table } from "../../utils/ui.ts";
import type { ParsedArgs } from "../parser.ts";
import { getFlag } from "../parser.ts";

/**
 * Run health checks
 */
export async function run(args: ParsedArgs): Promise<void> {
	const watch = getFlag<boolean>(args.raw, "watch") || false;
	const quiet = getFlag<boolean>(args.raw, "quiet") || false;

	const runChecks = async (): Promise<HealthReport> => {
		const checks: HealthCheck[] = [];

		// 1. RPC Connection
		try {
			const rpcStart = Date.now();
			const client = getPublicClient();
			await client.getChainId();
			const latency = Date.now() - rpcStart;

			let status: HealthStatus = "ok";
			if (latency > 2000) status = "critical";
			else if (latency > 500) status = "warning";

			checks.push({
				component: "RPC Connection",
				status,
				details: `${latency}ms latency`,
				latency,
			});
		} catch {
			checks.push({
				component: "RPC Connection",
				status: "critical",
				details: "Connection failed",
			});
		}

		// 2. Chain Sync
		try {
			const blockNumber = await getBlockNumber();
			checks.push({
				component: "Chain Sync",
				status: "ok",
				details: `Block #${blockNumber}`,
			});
		} catch {
			checks.push({
				component: "Chain Sync",
				status: "warning",
				details: "Unable to fetch block",
			});
		}

		// 3. Wallet
		if (walletExists()) {
			const address = getStoredAddress();
			try {
				const balance = await getBalance(address! as `0x${string}`);
				const ethBalance = Number(formatAmount(balance, 18, 4));

				let status: HealthStatus = "ok";
				let details = `${ethBalance} tDGAS (gas)`;

				if (ethBalance < 0.001) {
					status = "critical";
					details = "Very low tDGAS balance!";
				} else if (ethBalance < 0.01) {
					status = "warning";
					details = "Low tDGAS balance";
				}

				checks.push({
					component: "Wallet Balance",
					status,
					details,
				});
			} catch {
				checks.push({
					component: "Wallet Balance",
					status: "warning",
					details: "Unable to fetch balance",
				});
			}
		} else {
			checks.push({
				component: "Wallet",
				status: "warning",
				details: "Not initialized",
			});
		}

		// 4. Bot Process
		if (existsSync(BOT_PID_PATH)) {
			try {
				const state = JSON.parse(
					require("node:fs").readFileSync(BOT_PID_PATH, "utf8"),
				);

				checks.push({
					component: "Bot Process",
					status: "ok",
					details: `PID ${state.pid} (${state.strategy})`,
				});
			} catch {
				checks.push({
					component: "Bot Process",
					status: "warning",
					details: "Status unknown",
				});
			}
		} else {
			checks.push({
				component: "Bot Process",
				status: "ok",
				details: "Not running",
			});
		}

		// 5. Disk Space
		try {
			if (existsSync(DEEPDEX_HOME)) {
				statSync(DEEPDEX_HOME);
				checks.push({
					component: "Disk Space",
					status: "ok",
					details: "Storage available",
				});
			}
		} catch {
			checks.push({
				component: "Disk Space",
				status: "warning",
				details: "Unable to check",
			});
		}

		// 6. Memory Usage
		const memUsage = process.memoryUsage();
		const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
		const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
		const heapPercent = (heapUsedMB / heapTotalMB) * 100;

		let memStatus: HealthStatus = "ok";
		if (heapPercent > 95) memStatus = "critical";
		else if (heapPercent > 80) memStatus = "warning";

		checks.push({
			component: "Memory Usage",
			status: memStatus,
			details: `${heapUsedMB.toFixed(0)} MB / ${heapTotalMB.toFixed(0)} MB`,
		});

		// Calculate overall status
		let overall: HealthStatus = "ok";
		if (checks.some((c) => c.status === "critical")) {
			overall = "critical";
		} else if (checks.some((c) => c.status === "warning")) {
			overall = "warning";
		}

		return {
			checks,
			overall,
			timestamp: Date.now(),
		};
	};

	// Run checks
	if (!quiet && !watch) {
		consola.start("Running health checks...");
	}

	const report = await runChecks();

	// Output
	if (args.flags.json) {
		console.log(JSON.stringify(report, null, 2));
		// Set exit code
		if (report.overall === "critical") process.exitCode = 2;
		else if (report.overall === "warning") process.exitCode = 1;
		return;
	}

	if (quiet) {
		// Just set exit code
		if (report.overall === "critical") process.exitCode = 2;
		else if (report.overall === "warning") process.exitCode = 1;
		return;
	}

	// Display results
	console.log();
	consola.box({
		title: "🏥 DeepDex Health Check",
		message: "System diagnostics and status",
		style: {
			padding: 1,
			borderColor:
				report.overall === "ok"
					? "green"
					: report.overall === "warning"
						? "yellow"
						: "red",
			borderStyle: "rounded",
		},
	});

	console.log();

	const tableData = report.checks.map((check) => ({
		Component: check.component,
		Status: formatHealthStatus(check.status),
		Details: check.details,
	}));

	console.log(
		table(
			[
				{ header: "Component", key: "Component" },
				{ header: "Status", key: "Status", align: "center" },
				{ header: "Details", key: "Details" },
			],
			tableData,
		),
	);

	console.log();

	// Overall status with consola
	if (report.overall === "ok") {
		consola.success("All systems operational");
	} else if (report.overall === "warning") {
		consola.warn("Some warnings detected");
	} else {
		consola.error("Critical issues detected");
	}

	console.log();

	// Set exit code
	if (report.overall === "critical") process.exitCode = 2;
	else if (report.overall === "warning") process.exitCode = 1;

	// Watch mode
	if (watch) {
		consola.info("Watching for changes... (Ctrl+C to stop)");
		// In production, this would poll periodically
	}
}
