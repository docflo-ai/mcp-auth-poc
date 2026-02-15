import { MYBANK_API_1_AUDIENCE, MYBANK_API_1_CLIENT_ID, MYBANK_API_1_CLIENT_SECRET, MYBANK_API_1_SCOPE, MYBANK_API_1_URL, getMybankApi1AccessToken, setMybankApi1AccessToken, } from "./config.js";
import { validateAPI1Token } from "./auth.js";
/**
 * Request a client_credentials token for MyBank API 1.
 */
export async function getAccessTokenAPI1() {
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
    return (await res.json());
}
/**
 * Fetch the account balance from MyBank API 1, refreshing the token when needed.
 */
export async function getRoles(account_number) {
    const current = getMybankApi1AccessToken();
    const isValid = await validateAPI1Token(current);
    if (!isValid) {
        const result = await getAccessTokenAPI1();
        setMybankApi1AccessToken(result.access_token);
        console.log("New Access Token from Auth0 for MyBank-API-1:", result.access_token);
    }
    else {
        console.log("Existing Access Token from Auth0 for MyBank-API-1:", current);
    }
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
