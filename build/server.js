import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools.js";
/**
 * MCP server instance and initialization.
 */
export const server = new McpServer({
    name: "MyBank",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
registerTools(server);
