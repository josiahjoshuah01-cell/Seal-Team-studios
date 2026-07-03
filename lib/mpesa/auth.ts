import { getMpesaConfig } from "@/lib/mpesa/config";
import { logError } from "@/lib/logger";

type MpesaTokenResponse = {
  access_token: string;
  expires_in: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Daraja OAuth flow:
 * 1. Base64-encode `consumer_key:consumer_secret`
 * 2. POST to `/oauth/v1/generate?grant_type=client_credentials`
 * 3. Use the returned bearer token on subsequent API calls (STK push, etc.)
 */
export async function getMpesaAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const { consumerKey, consumerSecret, apiBase } = getMpesaConfig();
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const response = await fetch(
    `${apiBase}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const body = await response.text();
    await logError("mpesa_token", new Error("Daraja token request failed"), {
      status: response.status,
      body,
    });
    throw new Error("Unable to connect to M-Pesa");
  }

  const data = (await response.json()) as MpesaTokenResponse;
  const expiresIn = Number(data.expires_in) || 3600;

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  return data.access_token;
}
