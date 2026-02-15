import { DOCFLO_API_URL } from "./config.js";

/**
 * Fetch the available roles in the Docflo platform using the caller's access token.
 */
export async function getRoles(accessToken: string): Promise<unknown> {
  const res = await fetch(DOCFLO_API_URL + "/user/roles", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API request failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Fetch organization (tenant) details from the Docflo API using the caller's access token.
 */
export async function getOrganization(accessToken: string): Promise<unknown> {
  const res = await fetch(DOCFLO_API_URL + "/organization", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API request failed: ${res.status} ${error}`);
  }

  return res.json();
}
