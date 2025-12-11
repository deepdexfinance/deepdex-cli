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

// Helper to run CLI command
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
			console.error("Failed to parse JSON:", jsonStr);
			// If parsing fails, return raw text or throw
			throw new Error(`Invalid JSON output from CLI: ${output}`);
		}
	} catch (error) {
		const err = error as Error & { stderr?: string };
		throw new Error(
			`CLI execution failed: ${err.message}\nStderr: ${err.stderr || ""}`,
		);
	}
}

// Start server
export async function startServer() {
	// Create MCP server
	const server = new McpServer({
		name: "deepdex-trader",
		version: "1.0.0",
	});

	// Tool: Check connection
	server.tool("check_status", {}, async () => {
		try {
			const result = await runCli(["health"]);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		} catch (e) {
			return {
				content: [
					{
						type: "text",
						text: `Error checking status: ${(e as Error).message}`,
					},
				],
				isError: true,
			};
		}
	});

	// Tool: List Markets
	server.tool("list_markets", {}, async () => {
		const result = await runCli(["market", "list"]);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	});

	// Tool: Get Market Price
	server.tool(
		"get_market_price",
		{
			pair: z.string(),
		},
		async ({ pair }) => {
			const result = await runCli(["market", "price", pair]);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: List Subaccounts
	server.tool("list_subaccounts", {}, async () => {
		const result = await runCli(["account", "list"]);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	});

	// Tool: Create Subaccount
	server.tool(
		"create_subaccount",
		{
			name: z.string(),
		},
		async ({ name }) => {
			// Note: create usually requires confirmation, so we use --yes implied by NON_INTERACTIVE or explicit flag if supported
			// The parser usually supports --yes
			const result = await runCli(["account", "create", name, "--yes"]);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: Deposit
	server.tool(
		"deposit",
		{
			amount: z.string().describe("Amount (e.g. '100', '50%')"),
			token: z.string().describe("Token symbol (e.g. 'USDC')"),
			account: z.string().describe("Subaccount name").optional(),
		},
		async ({ amount, token, account }) => {
			const args = ["account", "deposit", amount, token, "--yes"];
			if (account) {
				args.push("--account", account);
			}
			const result = await runCli(args);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: Withdraw
	server.tool(
		"withdraw",
		{
			amount: z.string(),
			token: z.string(),
			account: z.string().optional(),
		},
		async ({ amount, token, account }) => {
			const args = ["account", "withdraw", amount, token, "--yes"];
			if (account) {
				args.push("--account", account);
			}
			const result = await runCli(args);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: Place Spot Order
	server.tool(
		"place_spot_order",
		{
			side: z.enum(["buy", "sell"]),
			pair: z.string(),
			amount: z.string(),
			price: z.string().optional(),
			account: z.string().optional(),
		},
		async ({ side, pair, amount, price, account }) => {
			const args = ["spot", side, pair, amount, "--yes"];
			if (price) {
				args.push("--price", price);
			}
			if (account) {
				args.push("--account", account);
			}

			const result = await runCli(args);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: Place Perp Order
	server.tool(
		"place_perp_order",
		{
			side: z.enum(["long", "short"]),
			pair: z.string(),
			amount: z.string(),
			leverage: z.number().default(1),
			price: z.string().optional(),
			takeProfit: z.string().optional(),
			stopLoss: z.string().optional(),
			account: z.string().optional(),
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
			if (price) {
				args.push("--price", price);
			}
			if (takeProfit) {
				args.push("--tp", takeProfit);
			}
			if (stopLoss) {
				args.push("--sl", stopLoss);
			}
			if (account) {
				args.push("--account", account);
			}

			const result = await runCli(args);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: List Orders
	server.tool(
		"list_orders",
		{
			account: z.string().optional(),
			market: z.string().optional(),
		},
		async ({ account, market }) => {
			const args = ["order", "list"];
			if (account) args.push("--account", account);
			if (market) args.push("--market", market);

			const result = await runCli(args);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: Cancel Order
	server.tool(
		"cancel_order",
		{
			orderId: z.string(), // CLI takes string or number? usually CLI args are strings
		},
		async ({ orderId }) => {
			const result = await runCli(["order", "cancel", orderId, "--yes"]);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Tool: List Positions
	server.tool("list_positions", {}, async () => {
		const result = await runCli(["position", "list"]);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	});

	// Tool: Close Position
	server.tool(
		"close_position",
		{
			market: z.string(),
			size: z.string().optional().describe("Size to close (e.g. '50%', '0.1')"),
		},
		async ({ market, size }) => {
			const args = ["position", "close", market, "--yes"];
			if (size) {
				args.push("--size", size);
			}
			const result = await runCli(args);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		},
	);

	// Resource: GUIDE.md
	server.registerResource(
		"guide",
		"deepdex://guide",
		{ mimeType: "text/markdown" },
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

	// Resource: README.md
	server.registerResource(
		"guide",
		"deepdex://guide",
		{ mimeType: "text/markdown" },
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
				throw new Error(`Failed to read README.md: ${(e as Error).message}`);
			}
		},
	);
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
