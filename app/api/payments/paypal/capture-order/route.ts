import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/lib/logger";
import { capturePayPalOrder } from "@/lib/paypal/client";
import { isPayPalConfigured } from "@/lib/paypal/config";
import {
  markInvoicePaid,
  verifyInvoicePaymentAccess,
} from "@/lib/payments/invoices";

const bodySchema = z.object({
  invoice_id: z.string().uuid(),
  order_id: z.string().min(1),
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

    const capture = await capturePayPalOrder(body.order_id);

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Payment was not completed" },
        { status: 402 }
      );
    }

    await markInvoicePaid({
      invoiceId: body.invoice_id,
      paymentMethod: "paypal",
      paymentReference: capture.id,
    });

    revalidatePath("/portal/invoices");
    revalidatePath("/admin/invoices");

    return NextResponse.json({ success: true, status: "paid" });
  } catch (err) {
    await logError("paypal_capture_order_route", err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Unable to complete PayPal payment",
      },
      { status: 500 }
    );
  }
}
