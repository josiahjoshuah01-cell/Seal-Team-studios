import type { ReactElement } from "react";
import { Resend } from "resend";
import { logError } from "@/lib/logger";
import { getEmailFrom } from "@/lib/emails/config";

// Synchronous best-effort send for v1. A queue (e.g. Supabase Edge Function + cron retry)
// would improve delivery reliability if needed later.

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail({
  to,
  subject,
  react,
  tags,
}: {
  to: string | string[];
  subject: string;
  react: ReactElement;
  tags?: { name: string; value: string }[];
}) {
  const client = getResendClient();

  if (!client) {
    await logError("email", new Error("RESEND_API_KEY is not configured"), {
      to,
      subject,
    });
    return { success: false as const };
  }

  try {
    const { data, error } = await client.emails.send({
      from: getEmailFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      tags,
    });

    if (error) {
      await logError("email", error, { to, subject });
      return { success: false as const };
    }

    return { success: true as const, id: data?.id };
  } catch (error) {
    await logError("email", error, { to, subject });
    return { success: false as const };
  }
}
