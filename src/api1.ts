import {
  DOCFLO_API_AUDIENCE,
  DOCFLO_API_AUTH0_DOMAIN,
  DOCFLO_API_CLIENT_ID,
  DOCFLO_API_CLIENT_SECRET,
  DOCFLO_API_SCOPE,
  DOCFLO_API_URL,
  DocfloApiAccessToken,
  getDocfloApiAccessToken,
  setDocfloApiAccessToken,
} from "./config.js";

import { validateDocfloApiToken } from "./auth.js";

/**
 * Request a client_credentials token for the Docflo API.
 */
export async function getAccessTokenDocfloApi(): Promise<DocfloApiAccessToken> {
  const url = `https://${DOCFLO_API_AUTH0_DOMAIN}/oauth/token`;
  const body = {
    client_id: DOCFLO_API_CLIENT_ID,
    client_secret: DOCFLO_API_CLIENT_SECRET,
    audience: DOCFLO_API_AUDIENCE,
    scope: DOCFLO_API_SCOPE,
    grant_type: "client_credentials",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Auth0 token request failed: ${res.status} ${error}`);
  }

  return (await res.json()) as DocfloApiAccessToken;
}

/**
 * Ensure a valid Docflo API access token is available, refreshing if needed.
 */
async function ensureAccessToken(): Promise<void> {
  const current = getDocfloApiAccessToken();
  const isValid = await validateDocfloApiToken(current);

  if (!isValid) {
    const result = await getAccessTokenDocfloApi();
    setDocfloApiAccessToken(result.access_token);
    console.log("New Access Token from Auth0 for Docflo API:", result.access_token);
  } else {
    console.log("Existing Access Token from Auth0 for Docflo API:", current);
  }
}

/**
 * Fetch the available roles in the Docflo platform.
 */
export async function getRoles(): Promise<unknown> {
  await ensureAccessToken();

  const res = await fetch(DOCFLO_API_URL + "/user/roles", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getDocfloApiAccessToken(),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API request failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Fetch organization (tenant) details from the Docflo API.
 */
export async function getOrganization(): Promise<unknown> {
  await ensureAccessToken();

  const res = await fetch(DOCFLO_API_URL + "/organization", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getDocfloApiAccessToken(),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API request failed: ${res.status} ${error}`);
  }

  return res.json();
}
