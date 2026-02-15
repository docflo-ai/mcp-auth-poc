import express, { Request, RequestHandler, Response } from "express";
import { mcpMetadataRouter, requireAuth } from "./auth.js";

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./server.js";

/**
 * Create and start the Express app that exposes MCP transports.
 */
export function startApp(): void {
  const transports: { [sessionId: string]: SSEServerTransport } = {};

  const app = express();

  app.use(mcpMetadataRouter());

  app.get("/sse", requireAuth(), async (_: Request, res: Response) => {
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
  });

  app.post("/messages", requireAuth(), async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      pid: process.pid,
      timestamp: Date.now(),
    });
  });
  app.listen(4000);
  console.log("MCP Server is running in Express on port " + 4000);
}
