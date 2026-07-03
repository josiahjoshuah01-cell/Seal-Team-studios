import { getEnv } from "@/lib/env";

export function getPayPalApiBase(mode: "sandbox" | "live") {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalConfig() {
  const env = getEnv();

  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are not configured.");
  }

  return {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    mode: env.PAYPAL_MODE,
    apiBase: getPayPalApiBase(env.PAYPAL_MODE),
  };
}

export function isPayPalConfigured() {
  const env = getEnv();
  return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
}

export function getPayPalClientId() {
  return getEnv().PAYPAL_CLIENT_ID ?? "";
}
