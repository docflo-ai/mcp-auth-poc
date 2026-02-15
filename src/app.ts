import express, { Request, RequestHandler, Response } from "express";
import { mcpMetadataRouter, requireAuth } from "./auth.js";

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { server } from "./server.js";

/**
 * Create and start the Express app that exposes MCP transports.
 */
export function startApp(): void {
  const transports: { [sessionId: string]: SSEServerTransport } = {};

  const app = express();
  app.use(express.json());

  app.use(mcpMetadataRouter());

  app.get("/sse", requireAuth(), async (_: Request, res: Response) => {
    console.log("Received request to establish SSE connection");
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
  });
  app.post("/sse", requireAuth(), async (_: Request, res: Response) => {
    console.log(
      "Received POST to /sse, but this endpoint is not used for message handling. Please connect to /sse with a GET request to establish the SSE connection, and send messages to /messages with the sessionId query parameter.",
    );
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
  });
  app.get(
    "/sse/initialize",
    requireAuth(),
    async (_: Request, res: Response) => {
      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;
      res.on("close", () => {
        delete transports[transport.sessionId];
      });
      await server.connect(transport);
    },
  );
  // StreamableHTTP transport — used by Claude.ai custom connector
  app.post("/mcp", requireAuth(), async (req: Request, res: Response) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        transport.close();
      });
    } catch (err) {
      console.error("[MCP] Error handling request:", err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
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
  app.listen(process.env.PORT || 8081);
  console.log(
    "MCP Server is running in Express on port " + (process.env.PORT || 8081),
  );
}
