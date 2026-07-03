import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/lib/logger";
import { createPayPalOrder } from "@/lib/paypal/client";
import { isPayPalConfigured } from "@/lib/paypal/config";
import { verifyInvoicePaymentAccess } from "@/lib/payments/invoices";

const bodySchema = z.object({
  invoice_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: "PayPal is not configured" },
        { status: 503 }
      );
    }

    const body = bodySchema.parse(await request.json());
    const access = await verifyInvoicePaymentAccess(body.invoice_id);

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const order = await createPayPalOrder(
      Number(access.invoice.amount),
      access.invoice.currency
    );

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    await logError("paypal_create_order_route", err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Unable to start PayPal payment",
      },
      { status: 500 }
    );
  }
}
