import express from "express";
import { mcpMetadataRouter, requireAuth } from "./auth.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./server.js";
/**
 * Create and start the Express app that exposes MCP transports.
 */
export function startApp() {
    const transports = {};
    const app = express();
    app.use(mcpMetadataRouter());
    app.get("/sse", requireAuth(), async (_, res) => {
        const transport = new SSEServerTransport("/messages", res);
        transports[transport.sessionId] = transport;
        res.on("close", () => {
            delete transports[transport.sessionId];
        });
        await server.connect(transport);
    });
    app.post("/messages", requireAuth(), async (req, res) => {
        const sessionId = req.query.sessionId;
        const transport = transports[sessionId];
        if (transport) {
            await transport.handlePostMessage(req, res);
        }
        else {
            res.status(400).send("No transport found for sessionId");
        }
    });
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            uptime: process.uptime(),
            pid: process.pid,
            timestamp: Date.now(),
        });
    });
    app.listen(process.env.PORT || 3000);
    console.log("MCP Server is running in Express on port " + (process.env.PORT || 3000));
}
