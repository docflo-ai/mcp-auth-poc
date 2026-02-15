import {
  AUTH0_AUDIENCE,
  AUTH0_DOMAIN,
  MYBANK_API_1_AUDIENCE,
  MYBANK_API_1_AUTH0_DOMAIN,
  setMcpAccessToken,
} from "./config.js";
import {
  InvalidTokenError,
  ServerError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import express, { Request, RequestHandler, Response } from "express";

import { metadataHandler } from "@modelcontextprotocol/sdk/server/auth/handlers/metadata.js";

/**
 * Read raw request body as a Buffer.
 */
function readRawBody(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}

/**
 * Metadata router for the MCP authorization server discovery.
 *
 * This router advertises the MCP host as the OAuth issuer and
 * provides lightweight proxy endpoints that forward requests to the
 * upstream Auth0 provider so the MCP host appears to implement OAuth
 * endpoints required by the MCP client.
 */
export const mcpMetadataRouter = (): RequestHandler => {
  const router = express.Router();

  const MCP_BASE_URL =
    process.env.MCP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  // Serve OAuth metadata that advertises the MCP host as the issuer
  router.use(
    "/.well-known/oauth-authorization-server",
    metadataHandler({
      issuer: MCP_BASE_URL,
      authorization_endpoint: new URL("/authorize", MCP_BASE_URL).href,
      token_endpoint: new URL("/oauth/token", MCP_BASE_URL).href,
      registration_endpoint: new URL("/register", MCP_BASE_URL).href,
      response_types_supported: ["code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      scopes_supported: ["openid", "profile", "email", "read:userinfo"],
      default_scope: "openid profile email read:userinfo",
    }),
  );

  // Proxy /authorize to Auth0 (preserve query params)
  router.get("/authorize", (req: Request, res: Response) => {
    const authUrl = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          params.append(key, String(v));
        }
      } else if (value !== undefined) {
        params.set(key, String(value));
      }
    }
    authUrl.search = params.toString();
    res.redirect(authUrl.href);
  });

  // Proxy token requests to Auth0 (forward raw body and content-type)
  router.post("/oauth/token", async (req: Request, res: Response) => {
    try {
      const raw = await readRawBody(req);
      const contentType =
        (req.headers["content-type"] as string) ||
        "application/x-www-form-urlencoded";
      const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: "POST",
        headers: {
          "content-type": contentType,
        },
        body: new Uint8Array(raw),
      });
      const body = await tokenRes.text();
      res
        .status(tokenRes.status)
        .set(
          "content-type",
          tokenRes.headers.get("content-type") || "application/json",
        )
        .send(body);
    } catch (err) {
      console.error("Error proxying /oauth/token:", err);
      res.status(502).json({
        error: "Bad Gateway",
        error_description: "Failed to proxy token request",
      });
    }
  });

  // Proxy client registration requests to Auth0 dynamic registration endpoint
  router.post("/register", async (req: Request, res: Response) => {
    try {
      const raw = await readRawBody(req);
      const contentType =
        (req.headers["content-type"] as string) || "application/json";
      const regRes = await fetch(`https://${AUTH0_DOMAIN}/oidc/register`, {
        method: "POST",
        headers: {
          "content-type": contentType,
        },
        body: new Uint8Array(raw),
      });
      const body = await regRes.text();
      res
        .status(regRes.status)
        .set(
          "content-type",
          regRes.headers.get("content-type") || "application/json",
        )
        .send(body);
    } catch (err) {
      console.error("Error proxying /register:", err);
      res.status(502).json({
        error: "Bad Gateway",
        error_description: "Failed to proxy registration request",
      });
    }
  });

  return router;
};

/**
 * Express middleware that validates incoming Bearer tokens for MCP clients.
 */
export const requireAuth = (): RequestHandler => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;

      if (!header) {
        throw new InvalidTokenError("Missing Authorization header");
      }

      const [type, token] = header.split(" ");
      if (type.toLowerCase() !== "bearer" || !token) {
        throw new InvalidTokenError(
          "Invalid Authorization header format, expected 'Bearer TOKEN'",
        );
      }

      // update shared token state
      setMcpAccessToken(token);

      const valid = await validateToken(token);
      if (!valid) {
        throw new InvalidTokenError("Invalid Token");
      }

      console.log("MCP client token is valid!");

      next();
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        res.set(
          "WWW-Authenticate",
          `Bearer error="${error.errorCode}", error_description="${error.message}"`,
        );
        res.status(401).json(error.toResponseObject());
      } else {
        console.error("Unexpected error authenticating bearer token:", error);
        res
          .status(500)
          .json(new ServerError("Internal Server Error").toResponseObject());
      }
    }
  };
};

/* Token validation helpers using Auth0 JWKS */
const JWKS = createRemoteJWKSet(
  new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`),
);

export async function validateToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWKS, {
      audience: AUTH0_AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
    });
    return true;
  } catch (err) {
    return false;
  }
}

/* Auth0 userinfo helper */
export interface Auth0UserInfo {
  sub: string;
  name?: string;
  nickname?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  updated_at?: string;
  [key: string]: unknown;
}

export async function getUserInfo(accessToken: string): Promise<Auth0UserInfo> {
  const res = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Auth0 userinfo failed: ${res.status} ${error}`);
  }

  return res.json() as Promise<Auth0UserInfo>;
}

const MYBANK_API_1_JWKS = createRemoteJWKSet(
  new URL(`https://${MYBANK_API_1_AUTH0_DOMAIN}/.well-known/jwks.json`),
);

export async function validateAPI1Token(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, MYBANK_API_1_JWKS, {
      audience: MYBANK_API_1_AUDIENCE,
      issuer: `https://${MYBANK_API_1_AUTH0_DOMAIN}/`,
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
