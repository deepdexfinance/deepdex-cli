/**
 * MCP Server command
 */
import { startServer } from "../../mcp/server.ts";
import type { ParsedArgs } from "../parser.ts";

export async function start(_args: ParsedArgs): Promise<void> {
	await startServer();
}
