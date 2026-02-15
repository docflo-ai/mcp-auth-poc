/**
 * Central configuration and mutable tokens for the MCP server.
 *
 * Keep simple, typed exports for use across modules.
 */

export let MCP_ACCESS_TOKEN: string = "new_token";
export let MYBANK_API_1_ACCESS_TOKEN: string = "new_token";

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
export const AUTH0_DOMAIN = "docflo-lab.eu.auth0.com";
export const AUTH0_AUDIENCE = "https://docflo-auth-api";

/* Types */
export interface MybankApiAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Balance {
  balance: string;
}
