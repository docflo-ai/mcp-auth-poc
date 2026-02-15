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
 * Metadata router for the MCP authorization server discovery.
 */
export const mcpMetadataRouter = (): RequestHandler => {
  const router = express.Router();

  router.use(
    "/.well-known/oauth-authorization-server",
    metadataHandler({
      issuer: `https://${AUTH0_DOMAIN}`,
      authorization_endpoint: new URL("/authorize", `https://${AUTH0_DOMAIN}`)
        .href,
      token_endpoint: new URL("/oauth/token", `https://${AUTH0_DOMAIN}`).href,
      registration_endpoint: new URL(
        "/oidc/register",
        `https://${AUTH0_DOMAIN}`,
      ).href,
      response_types_supported: ["code"],

      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      scopes_supported: ["openid", "profile", "email", "read:userinfo"],
      default_scope: "openid profile email read:userinfo",
    }),
  );

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
