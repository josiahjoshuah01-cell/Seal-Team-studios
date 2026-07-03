import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import { isMpesaConfigured } from "@/lib/mpesa/config";
import { isValidMpesaPhone, normalizeMpesaPhone } from "@/lib/mpesa/phone";
import { initiateStkPush } from "@/lib/mpesa/stk";
import { verifyInvoicePaymentAccess } from "@/lib/payments/invoices";

const bodySchema = z.object({
  invoice_id: z.string().uuid(),
  phone_number: z.string().min(9, "Phone number is required"),
});

export async function POST(request: Request) {
  try {
    if (!isMpesaConfigured()) {
      return NextResponse.json(
        { error: "M-Pesa is not configured" },
        { status: 503 }
      );
    }

    const body = bodySchema.parse(await request.json());
    const normalizedPhone = normalizeMpesaPhone(body.phone_number);

    if (!normalizedPhone || !isValidMpesaPhone(normalizedPhone)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Safaricom number (e.g. 0712345678 or 254712345678)",
        },
        { status: 400 }
      );
    }

    const access = await verifyInvoicePaymentAccess(body.invoice_id);

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (access.invoice.currency !== "KES") {
      return NextResponse.json(
        { error: "M-Pesa payments are only supported for KES invoices" },
        { status: 400 }
      );
    }

    const stk = await initiateStkPush({
      phoneNumber: normalizedPhone,
      amount: Number(access.invoice.amount),
      accountReference: access.invoice.id.replace(/-/g, "").slice(0, 12),
      transactionDesc: "Invoice",
    });

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("invoices")
      .update({ mpesa_checkout_request_id: stk.CheckoutRequestID })
      .eq("id", body.invoice_id)
      .eq("status", "pending");

    if (updateError) throw updateError;

    return NextResponse.json({
      checkoutRequestId: stk.CheckoutRequestID,
      customerMessage: stk.CustomerMessage,
    });
  } catch (err) {
    await logError("mpesa_stk_push", err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Unable to start M-Pesa payment",
      },
      { status: 500 }
    );
  }
}
