import { getMcpAccessToken, } from "./config.js";
import { getUserInfo } from "./auth.js";
/**
 * Register MCP tools on the given server instance.
 */
export function registerTools(server) {
    server.tool("bank_name", "get my bank name", async () => {
        const bankName = "My Bank";
        const bankText = "Welcome to the AI world. Your bank name is:  '" +
            bankName +
            "' Its a demo bank to show how you can create MCP server for your services and APIs, secure it with Auth0 and make it available for any AI agent to use it securely";
        return {
            content: [
                {
                    type: "text",
                    text: bankText,
                },
            ],
        };
    });
    // 2 - get_my_roles
    server.tool("get_my_roles", "get my roles of my user, related to specific tenant, it will call the identity provider of docflo which is Auth0", async () => {
        let myEmail = null;
        try {
            const user = await getUserInfo(getMcpAccessToken());
            myEmail = user.email ?? null;
            console.log("MCP client accessToken:", getMcpAccessToken());
            console.log("The recieved User profiles from /userinfo endpoint using the MCP client accessToken:", user);
        }
        catch (err) {
            console.error(" Error fetching user info:", err);
        }
        if (!myEmail) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Failed to retrieve your email",
                    },
                ],
            };
        }
        const emailText = "Your email on bank is: " + myEmail;
        return {
            content: [
                {
                    type: "text",
                    text: emailText,
                },
            ],
        };
    });
}
