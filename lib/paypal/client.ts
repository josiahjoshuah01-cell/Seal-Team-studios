import { getPayPalConfig } from "@/lib/paypal/config";
import { logError } from "@/lib/logger";

type PayPalTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const { clientId, clientSecret, apiBase } = getPayPalConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    await logError("paypal_token", new Error("PayPal token request failed"), {
      status: response.status,
      body,
    });
    throw new Error("Unable to connect to PayPal");
  }

  const data = (await response.json()) as PayPalTokenResponse;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function createPayPalOrder(amount: number, currency: string) {
  const { apiBase } = getPayPalConfig();
  const token = await getPayPalAccessToken();

  const response = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    await logError("paypal_create_order", new Error("PayPal order creation failed"), {
      status: response.status,
      body,
    });
    throw new Error("Unable to create PayPal order");
  }

  return (await response.json()) as { id: string };
}

export async function capturePayPalOrder(orderId: string) {
  const { apiBase } = getPayPalConfig();
  const token = await getPayPalAccessToken();

  const response = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    await logError("paypal_capture_order", new Error("PayPal capture failed"), {
      orderId,
      status: response.status,
      body,
    });
    throw new Error("Unable to capture PayPal payment");
  }

  return (await response.json()) as {
    id: string;
    status: string;
  };
}
