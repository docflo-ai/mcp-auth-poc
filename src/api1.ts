import {
  MYBANK_API_1_AUDIENCE,
  MYBANK_API_1_CLIENT_ID,
  MYBANK_API_1_CLIENT_SECRET,
  MYBANK_API_1_SCOPE,
  MYBANK_API_1_URL,
  MybankApiAccessToken,
  getMybankApi1AccessToken,
  setMybankApi1AccessToken,
} from "./config.js";

import { validateAPI1Token } from "./auth.js";

/**
 * Request a client_credentials token for MyBank API 1.
 */
export async function getAccessTokenAPI1(): Promise<MybankApiAccessToken> {
  const url = `https://${MYBANK_API_1_AUDIENCE.replace(/^https?:\/\//, "")}/oauth/token`;
  const body = {
    client_id: MYBANK_API_1_CLIENT_ID,
    client_secret: MYBANK_API_1_CLIENT_SECRET,
    audience: MYBANK_API_1_AUDIENCE,
    scope: MYBANK_API_1_SCOPE,
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

  return (await res.json()) as MybankApiAccessToken;
}

/**
 * Ensure a valid API 1 access token is available, refreshing if needed.
 */
async function ensureAccessToken(): Promise<void> {
  const current = getMybankApi1AccessToken();
  const isValid = await validateAPI1Token(current);

  if (!isValid) {
    const result = await getAccessTokenAPI1();
    setMybankApi1AccessToken(result.access_token);
    console.log(
      "New Access Token from Auth0 for MyBank-API-1:",
      result.access_token,
    );
  } else {
    console.log("Existing Access Token from Auth0 for MyBank-API-1:", current);
  }
}

/**
 * Fetch the available roles in the Docflo platform.
 */
export async function getRoles(): Promise<unknown> {
  await ensureAccessToken();

  const res = await fetch(MYBANK_API_1_URL + "/user/roles", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getMybankApi1AccessToken(),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API request failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Fetch organization (tenant) details from Docflo.
 */
export async function getOrganization(): Promise<unknown> {
  await ensureAccessToken();

  const res = await fetch(MYBANK_API_1_URL + "/organization", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getMybankApi1AccessToken(),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API request failed: ${res.status} ${error}`);
  }

  return res.json();
}
