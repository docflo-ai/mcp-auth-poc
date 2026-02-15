/**
 * Central configuration and mutable tokens for the MCP server.
 *
 * Keep simple, typed exports for use across modules.
 */

import dotenv from "dotenv";
dotenv.config();

export let MCP_ACCESS_TOKEN: string =
  process.env.MCP_ACCESS_TOKEN ?? "new_token";
export let MYBANK_API_1_ACCESS_TOKEN: string =
  process.env.MYBANK_API_1_ACCESS_TOKEN ?? "new_token";

export function setMcpAccessToken(token: string): void {
  MCP_ACCESS_TOKEN = token;
}
export function getMcpAccessToken(): string {
  return MCP_ACCESS_TOKEN;
}

export function setMybankApi1AccessToken(token: string): void {
  MYBANK_API_1_ACCESS_TOKEN = token;
}
export function getMybankApi1AccessToken(): string {
  return MYBANK_API_1_ACCESS_TOKEN;
}

/* Auth0 / MyBank API configuration */
export const AUTH0_DOMAIN: string =
  process.env.AUTH0_DOMAIN ?? "docflo-lab.eu.auth0.com";
export const AUTH0_AUDIENCE: string =
  process.env.AUTH0_AUDIENCE ?? "https://docflo-auth-api";

export const MYBANK_API_1_AUTH0_DOMAIN: string =
  process.env.MYBANK_API_1_AUTH0_DOMAIN ?? "docflo-lab.eu.auth0.com";
export const MYBANK_API_1_CLIENT_ID: string =
  process.env.MYBANK_API_1_CLIENT_ID ?? "zau8VYau9dnZahoSahTRfl2waaadTVnZ";
export const MYBANK_API_1_CLIENT_SECRET: string =
  process.env.MYBANK_API_1_CLIENT_SECRET ??
  "rOQwmkHZgVriiv_rfK7BYUSa6rfmimlNy7oKQoA62mP6y13pqfWRZql-fsze8Go8";
export const MYBANK_API_1_AUDIENCE: string =
  process.env.MYBANK_API_1_AUDIENCE ?? "https://docflo-auth-api";
export const MYBANK_API_1_SCOPE: string =
  process.env.MYBANK_API_1_SCOPE ?? "read:balance";
export const MYBANK_API_1_URL: string =
  process.env.MYBANK_API_1_URL ?? "https://api.lab.docflo.ai/auth";

/* Types */
export interface MybankApiAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Balance {
  balance: string;
}
