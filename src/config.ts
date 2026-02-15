/**
 * Central configuration and mutable tokens for the MCP server.
 *
 * Keep simple, typed exports for use across modules.
 */

import dotenv from "dotenv";
dotenv.config();

export let MCP_ACCESS_TOKEN: string =
  process.env.MCP_ACCESS_TOKEN ?? "new_token";
export let DOCFLO_API_ACCESS_TOKEN: string =
  process.env.DOCFLO_API_ACCESS_TOKEN ?? "new_token";

export function setMcpAccessToken(token: string): void {
  MCP_ACCESS_TOKEN = token;
}
export function getMcpAccessToken(): string {
  return MCP_ACCESS_TOKEN;
}

export function setDocfloApiAccessToken(token: string): void {
  DOCFLO_API_ACCESS_TOKEN = token;
}
export function getDocfloApiAccessToken(): string {
  return DOCFLO_API_ACCESS_TOKEN;
}

/* Auth0 / Docflo API configuration */
export const AUTH0_DOMAIN: string =
  process.env.AUTH0_DOMAIN ?? "docflo-lab.eu.auth0.com";
export const AUTH0_AUDIENCE: string =
  process.env.AUTH0_AUDIENCE ?? "https://docflo-auth-api";

export const DOCFLO_API_AUTH0_DOMAIN: string =
  process.env.DOCFLO_API_AUTH0_DOMAIN ?? "docflo-lab.eu.auth0.com";
export const DOCFLO_API_CLIENT_ID: string =
  process.env.DOCFLO_API_CLIENT_ID ?? "zau8VYau9dnZahoSahTRfl2waaadTVnZ";
export const DOCFLO_API_CLIENT_SECRET: string =
  process.env.DOCFLO_API_CLIENT_SECRET ??
  "rOQwmkHZgVriiv_rfK7BYUSa6rfmimlNy7oKQoA62mP6y13pqfWRZql-fsze8Go8";
export const DOCFLO_API_AUDIENCE: string =
  process.env.DOCFLO_API_AUDIENCE ?? "https://docflo-auth-api";
export const DOCFLO_API_SCOPE: string =
  process.env.DOCFLO_API_SCOPE ?? "read:balance";
export const DOCFLO_API_URL: string =
  process.env.DOCFLO_API_URL ?? "https://api.lab.docflo.ai/auth";

/* Types */
export interface DocfloApiAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}
