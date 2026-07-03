import { getEnv } from "@/lib/env";

export function getMpesaApiBase(env: "sandbox" | "production" = getEnv().MPESA_ENV) {
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export function isMpesaConfigured() {
  const env = getEnv();
  return Boolean(
    env.MPESA_CONSUMER_KEY &&
      env.MPESA_CONSUMER_SECRET &&
      env.MPESA_SHORTCODE &&
      env.MPESA_PASSKEY
  );
}

export function getMpesaConfig() {
  const env = getEnv();

  if (!isMpesaConfigured()) {
    throw new Error("M-Pesa credentials are not configured.");
  }

  return {
    consumerKey: env.MPESA_CONSUMER_KEY!,
    consumerSecret: env.MPESA_CONSUMER_SECRET!,
    shortcode: env.MPESA_SHORTCODE!,
    passkey: env.MPESA_PASSKEY!,
    apiBase: getMpesaApiBase(env.MPESA_ENV),
    callbackUrl: `${env.NEXT_PUBLIC_SITE_URL}/api/payments/mpesa/callback`,
  };
}
