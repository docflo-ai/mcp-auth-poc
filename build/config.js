/**
 * Central configuration and mutable tokens for the MCP server.
 *
 * Keep simple, typed exports for use across modules.
 */
export let MCP_ACCESS_TOKEN = "new_token";
export let MYBANK_API_1_ACCESS_TOKEN = "new_token";
export function setMcpAccessToken(token) {
    MCP_ACCESS_TOKEN = token;
}
export function getMcpAccessToken() {
    return MCP_ACCESS_TOKEN;
}
export function setMybankApi1AccessToken(token) {
    MYBANK_API_1_ACCESS_TOKEN = token;
}
export function getMybankApi1AccessToken() {
    return MYBANK_API_1_ACCESS_TOKEN;
}
/* Auth0 / MyBank API configuration */
export const AUTH0_DOMAIN = "docflo-lab.eu.auth0.com";
export const AUTH0_AUDIENCE = "https://docflo-auth-api";
export const MYBANK_API_1_AUTH0_DOMAIN = "docflo-lab.eu.auth0.com";
export const MYBANK_API_1_CLIENT_ID = "zau8VYau9dnZahoSahTRfl2waaadTVnZ";
export const MYBANK_API_1_CLIENT_SECRET = "rOQwmkHZgVriiv_rfK7BYUSa6rfmimlNy7oKQoA62mP6y13pqfWRZql-fsze8Go8";
export const MYBANK_API_1_AUDIENCE = "https://docflo-auth-api";
export const MYBANK_API_1_SCOPE = "read:balance";
export const MYBANK_API_1_URL = "https://api.lab.docflo.ai/auth";
