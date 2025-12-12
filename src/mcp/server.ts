import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// Path to the CLI entry point
const CLI_PATH = path.resolve(__dirname, "../../index.ts");
const BUN_CMD = "bun";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a successful tool result with JSON content
 */
function successResult(data: unknown) {
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(data, null, 2),
			},
		],
	};
}

/**
 * Create a successful tool result with plain text content
 */
function textResult(text: string) {
	return {
		content: [
			{
				type: "text" as const,
				text,
			},
		],
	};
}

/**
 * Create an error tool result
 */
function errorResult(message: string) {
	return {
		content: [
			{
				type: "text" as const,
				text: message,
			},
		],
		isError: true,
	};
}

/**
 * Run a CLI command and return parsed JSON result
 */
async function runCli(args: string[]): Promise<unknown> {
	const command = `${BUN_CMD} ${CLI_PATH} ${args.join(" ")} --json`;

	try {
		const { stdout } = await execAsync(command, {
			env: {
				...process.env,
				// Ensure non-interactive mode is set
				DEEPDEX_NON_INTERACTIVE: "true",
			},
		});

		// Try to find JSON in stdout
		// Sometimes there might be other logs, so look for the first '{' and last '}'
		const output = stdout.trim();
		const firstBrace = output.indexOf("{");
		const lastBrace = output.lastIndexOf("}");
		const firstBracket = output.indexOf("[");
		const lastBracket = output.lastIndexOf("]");

		let jsonStr = output;

		if (firstBrace !== -1 && lastBrace !== -1) {
			// Check if array is outer or object is outer
			if (firstBracket !== -1 && firstBracket < firstBrace) {
				jsonStr = output.substring(firstBracket, lastBracket + 1);
			} else {
				jsonStr = output.substring(firstBrace, lastBrace + 1);
			}
		} else if (firstBracket !== -1 && lastBracket !== -1) {
			jsonStr = output.substring(firstBracket, lastBracket + 1);
		}

		try {
			return JSON.parse(jsonStr);
		} catch (_e) {
			// If parsing fails, throw with raw output
			throw new Error(`Invalid JSON output from CLI: ${output}`);
		}
	} catch (error) {
		const err = error as Error & { stderr?: string };
		throw new Error(
			`CLI execution failed: ${err.message}${err.stderr ? `\nStderr: ${err.stderr}` : ""}`,
		);
	}
}

/**
 * Execute a CLI command and return a tool result
 * Handles errors automatically
 */
async function executeCliTool(args: string[]) {
	try {
		const result = await runCli(args);
		return successResult(result);
	} catch (e) {
		return errorResult(`Error: ${(e as Error).message}`);
	}
}

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * Register all tools on the MCP server
 */
function registerTools(server: McpServer) {
	// -------------------------------------------------------------------------
	// Status & Information Tools
	// -------------------------------------------------------------------------

	server.tool(
		"check_status",
		"Check the connection status of the DeepDex CLI",
		{},
		async () => executeCliTool(["health"]),
	);

	server.tool(
		"guide",
		"Read the DeepDex user guide for documentation and usage instructions",
		{},
		async () => {
			const guidePath = path.resolve(__dirname, "../../GUIDE.md");
			try {
				const text = await readFile(guidePath, "utf-8");
				return textResult(text);
			} catch (e) {
				return errorResult(`Error reading guide: ${(e as Error).message}`);
			}
		},
	);

	// -------------------------------------------------------------------------
	// Market Tools
	// -------------------------------------------------------------------------

	server.tool(
		"list_markets",
		"List all available trading markets",
		{},
		async () => executeCliTool(["market", "list"]),
	);

	server.tool(
		"get_market_price",
		"Get the current price of a specific market pair",
		{
			pair: z.string().describe("Market pair (e.g. BTC-PERP, ETH-PERP)"),
		},
		async ({ pair }) => executeCliTool(["market", "price", pair]),
	);

	// -------------------------------------------------------------------------
	// Subaccount Tools
	// -------------------------------------------------------------------------

	server.tool(
		"list_subaccounts",
		"List all subaccounts associated with the wallet",
		{},
		async () => executeCliTool(["account", "list"]),
	);

	server.tool(
		"create_subaccount",
		"Create a new subaccount with the specified name",
		{
			name: z.string().describe("Name of the new subaccount"),
		},
		async ({ name }) => executeCliTool(["account", "create", name, "--yes"]),
	);

	// -------------------------------------------------------------------------
	// Deposit & Withdraw Tools
	// -------------------------------------------------------------------------

	server.tool(
		"deposit",
		"Deposit tokens into a subaccount",
		{
			amount: z
				.string()
				.describe("Amount to deposit (e.g. '100', '50%' for percentage)"),
			token: z.string().describe("Token symbol (e.g. 'USDC')"),
			account: z.string().optional().describe("Subaccount name (optional)"),
		},
		async ({ amount, token, account }) => {
			const args = ["account", "deposit", amount, token, "--yes"];
			if (account) args.push("--account", account);
			return executeCliTool(args);
		},
	);

	server.tool(
		"withdraw",
		"Withdraw tokens from a subaccount",
		{
			amount: z
				.string()
				.describe("Amount to withdraw (e.g. '100', '50%' for percentage)"),
			token: z.string().describe("Token symbol (e.g. 'USDC')"),
			account: z.string().optional().describe("Subaccount name (optional)"),
		},
		async ({ amount, token, account }) => {
			const args = ["account", "withdraw", amount, token, "--yes"];
			if (account) args.push("--account", account);
			return executeCliTool(args);
		},
	);

	// -------------------------------------------------------------------------
	// Spot Trading Tools
	// -------------------------------------------------------------------------

	server.tool(
		"place_spot_order",
		"Place a limit or market order on the spot market",
		{
			side: z.enum(["buy", "sell"]).describe("Order side (buy or sell)"),
			pair: z.string().describe("Market pair (e.g. BTC-USDC, ETH-USDC)"),
			amount: z.string().describe("Amount to trade"),
			price: z
				.string()
				.optional()
				.describe("Limit price (omit for market order)"),
			account: z.string().optional().describe("Subaccount name (optional)"),
		},
		async ({ side, pair, amount, price, account }) => {
			const args = ["spot", side, pair, amount, "--yes"];
			if (price) args.push("--price", price);
			if (account) args.push("--account", account);
			return executeCliTool(args);
		},
	);

	// -------------------------------------------------------------------------
	// Perpetual Trading Tools
	// -------------------------------------------------------------------------

	server.tool(
		"place_perp_order",
		"Place a long or short order on the perpetual market",
		{
			side: z.enum(["long", "short"]).describe("Order side (long or short)"),
			pair: z.string().describe("Market pair (e.g. BTC-PERP, ETH-PERP)"),
			amount: z.string().describe("Amount to trade in USD value"),
			leverage: z
				.number()
				.default(1)
				.describe("Leverage multiplier (default: 1)"),
			price: z
				.string()
				.optional()
				.describe("Limit price (omit for market order)"),
			takeProfit: z.string().optional().describe("Take profit price"),
			stopLoss: z.string().optional().describe("Stop loss price"),
			account: z.string().optional().describe("Subaccount name (optional)"),
		},
		async ({
			side,
			pair,
			amount,
			leverage,
			price,
			takeProfit,
			stopLoss,
			account,
		}) => {
			const args = [
				"perp",
				side,
				pair,
				amount,
				"--leverage",
				leverage.toString(),
				"--yes",
			];
			if (price) args.push("--price", price);
			if (takeProfit) args.push("--tp", takeProfit);
			if (stopLoss) args.push("--sl", stopLoss);
			if (account) args.push("--account", account);
			return executeCliTool(args);
		},
	);

	// -------------------------------------------------------------------------
	// Order Management Tools
	// -------------------------------------------------------------------------

	server.tool(
		"list_orders",
		"List open orders",
		{
			account: z.string().optional().describe("Subaccount name (optional)"),
			market: z.string().optional().describe("Filter by market (optional)"),
		},
		async ({ account, market }) => {
			const args = ["order", "list"];
			if (account) args.push("--account", account);
			if (market) args.push("--market", market);
			return executeCliTool(args);
		},
	);

	server.tool(
		"cancel_order",
		"Cancel an existing order by its ID",
		{
			orderId: z.string().describe("ID of the order to cancel"),
		},
		async ({ orderId }) =>
			executeCliTool(["order", "cancel", orderId, "--yes"]),
	);

	// -------------------------------------------------------------------------
	// Position Management Tools
	// -------------------------------------------------------------------------

	server.tool(
		"list_positions",
		"List all current open positions",
		{},
		async () => executeCliTool(["position", "list"]),
	);

	server.tool(
		"close_position",
		"Close an open position partially or fully",
		{
			market: z.string().describe("Market symbol (e.g. BTC-PERP)"),
			size: z
				.string()
				.optional()
				.describe(
					"Size to close (e.g. '50%', '0.1'). Omit to close entire position",
				),
		},
		async ({ market, size }) => {
			const args = ["position", "close", market, "--yes"];
			if (size) args.push("--size", size);
			return executeCliTool(args);
		},
	);
}

// ============================================================================
// Resource Definitions
// ============================================================================

/**
 * Register all resources on the MCP server
 */
function registerResources(server: McpServer) {
	server.resource(
		"guide",
		"deepdex://guide",
		{
			description: "DeepDex user guide and documentation",
			mimeType: "text/markdown",
		},
		async (uri) => {
			const guidePath = path.resolve(__dirname, "../../GUIDE.md");
			try {
				const text = await readFile(guidePath, "utf-8");
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/markdown",
							text,
						},
					],
				};
			} catch (e) {
				throw new Error(`Failed to read GUIDE.md: ${(e as Error).message}`);
			}
		},
	);
}

// ============================================================================
// Server Entry Point
// ============================================================================

/**
 * Start the MCP server
 */
export async function startServer() {
	const server = new McpServer({
		name: "deepdex-trader",
		version: "1.0.0",
	});

	// Register all tools and resources
	registerTools(server);
	registerResources(server);

	// Connect via stdio transport
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
