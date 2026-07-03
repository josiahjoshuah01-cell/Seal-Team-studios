import { getMpesaAccessToken } from "@/lib/mpesa/auth";
import { getMpesaConfig } from "@/lib/mpesa/config";
import { logError } from "@/lib/logger";

/**
 * Daraja Lipa Na M-Pesa Online (STK Push) password generation:
 *
 * 1. Build a timestamp string in `YYYYMMDDHHmmss` (East Africa / local server time).
 * 2. Concatenate: `BusinessShortCode + Passkey + Timestamp` (no separators).
 * 3. Base64-encode that string — this is the `Password` field in the STK request.
 *
 * The same `Timestamp` value must be sent in the request body alongside `Password`.
 */
export function generateMpesaTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export function generateMpesaPassword(
  shortcode: string,
  passkey: string,
  timestamp: string
) {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

type StkPushResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

export async function initiateStkPush({
  phoneNumber,
  amount,
  accountReference,
  transactionDesc,
}: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}) {
  const { shortcode, passkey, apiBase, callbackUrl } = getMpesaConfig();
  const token = await getMpesaAccessToken();
  const timestamp = generateMpesaTimestamp();
  const password = generateMpesaPassword(shortcode, passkey, timestamp);

  const response = await fetch(`${apiBase}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: transactionDesc.slice(0, 13),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    await logError("mpesa_stk_push", new Error("Daraja STK push HTTP error"), {
      status: response.status,
      body,
    });
    throw new Error("Unable to initiate M-Pesa payment");
  }

  const data = (await response.json()) as StkPushResponse;

  if (data.ResponseCode !== "0") {
    await logError("mpesa_stk_push", new Error("Daraja STK push rejected"), {
      response: data,
    });
    throw new Error(data.CustomerMessage || "M-Pesa payment could not be started");
  }

  return data;
}
