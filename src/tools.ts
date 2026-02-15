import { getOrganization, getRoles } from "./api1.js";
import { getMcpAccessToken } from "./config.js";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register MCP tools on the given server instance.
 */
export function registerTools(server: McpServer): void {
  // 2 - get_my_roles
  server.tool(
    "get_my_roles",
    "get my roles of my user, related to specific tenant, it will call the identity provider of docflo which is Auth0",
    async () => {
      try {
        const roles = await getRoles(getMcpAccessToken());
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(roles, null, 2),
            },
          ],
        };
      } catch (err) {
        console.error("Error fetching roles:", err);
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve roles: " + String(err),
            },
          ],
        };
      }
    },
  );

  // 3 - get_organization
  server.tool(
    "get_organization",
    "get details about my docflo tenant that I am connected to",
    async () => {
      try {
        const org = await getOrganization(getMcpAccessToken());
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(org, null, 2),
            },
          ],
        };
      } catch (err) {
        console.error("Error fetching organization:", err);
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve organization: " + String(err),
            },
          ],
        };
      }
    },
  );
}
