import { DOCFLO_API_URL } from "./config.js";

interface OrgMetadata {
  tenantId?: string;
  [key: string]: unknown;
}

interface Organization {
  id: string;
  name: string;
  display_name: string;
  metadata?: OrgMetadata;
}

interface UserOrganizationsResponse {
  organizations: Organization[];
  limit: number;
}

/**
 * Decode the org_id claim from a JWT without verifying the signature.
 * The token has already been verified by the auth middleware.
 */
function getOrgIdFromToken(accessToken: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
    );
    return (payload.org_id as string) ?? null;
  } catch {
    return null;
  }
}

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
 * Resolve the tenantId for the current user's active org by calling /user/organizations.
 */
async function resolveTenantId(accessToken: string): Promise<string> {
  const orgId = getOrgIdFromToken(accessToken);
  if (!orgId) {
    throw new Error("Could not extract org_id from access token");
  }

  const res = await fetch(DOCFLO_API_URL + "/user/organizations", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch user organizations: ${res.status} ${error}`);
  }

  const data = (await res.json()) as UserOrganizationsResponse;
  const org = data.organizations.find((o) => o.id === orgId);

  if (!org) {
    throw new Error(`Organization ${orgId} not found in user's organizations`);
  }

  const tenantId = org.metadata?.tenantId;
  if (!tenantId) {
    throw new Error(`No tenantId found in metadata for organization ${orgId}`);
  }

  return tenantId;
}

/**
 * Fetch organization (tenant) details from the Docflo API.
 * Resolves the tenantId from /user/organizations and passes it as x-tenant-id.
 */
export async function getOrganization(accessToken: string): Promise<unknown> {
  const tenantId = await resolveTenantId(accessToken);

  const res = await fetch(DOCFLO_API_URL + "/organization", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
      "x-tenant-id": tenantId,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API request failed: ${res.status} ${error}`);
  }

  return res.json();
}
