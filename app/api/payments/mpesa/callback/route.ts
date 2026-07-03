import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import {
  markInvoiceFailed,
  markInvoicePaid,
} from "@/lib/payments/invoices";
import { notifyPaymentFailed } from "@/lib/emails/notify";

type CallbackMetadataItem = {
  Name: string;
  Value?: string | number;
};

type StkCallbackPayload = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: CallbackMetadataItem[];
      };
    };
  };
};

function extractReceiptNumber(items: CallbackMetadataItem[] | undefined) {
  const receipt = items?.find((item) => item.Name === "MpesaReceiptNumber");
  return receipt?.Value != null ? String(receipt.Value) : null;
}

function acceptedResponse() {
  return NextResponse.json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });
}

export async function POST(request: Request) {
  let payload: StkCallbackPayload;

  try {
    payload = (await request.json()) as StkCallbackPayload;
  } catch (err) {
    await logError("mpesa_callback", err, { stage: "parse_json" });
    return acceptedResponse();
  }

  const callback = payload.Body?.stkCallback;

  if (
    !callback ||
    typeof callback.CheckoutRequestID !== "string" ||
    typeof callback.ResultCode !== "number"
  ) {
    await logError("mpesa_callback", new Error("Malformed M-Pesa callback payload"), {
      payload,
    });
    return acceptedResponse();
  }

  const checkoutRequestId = callback.CheckoutRequestID;
  const admin = createAdminClient();

  const { data: invoice, error: lookupError } = await admin
    .from("invoices")
    .select("id, status")
    .eq("mpesa_checkout_request_id", checkoutRequestId)
    .maybeSingle();

  if (lookupError || !invoice) {
    await logError("mpesa_callback", new Error("Invoice not found for callback"), {
      checkoutRequestId,
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
    });
    return acceptedResponse();
  }

  try {
    if (callback.ResultCode === 0) {
      const receipt = extractReceiptNumber(callback.CallbackMetadata?.Item);

      if (invoice.status === "pending") {
        await markInvoicePaid({
          invoiceId: invoice.id,
          paymentMethod: "mpesa",
          paymentReference: receipt,
        });
      }

      revalidatePath("/portal/invoices");
      revalidatePath("/admin/invoices");
    } else {
      if (invoice.status === "pending") {
        await markInvoiceFailed(invoice.id);
        void notifyPaymentFailed(invoice.id, callback.ResultDesc ?? null);
      }

      await logError("mpesa_callback", new Error("M-Pesa payment failed"), {
        invoiceId: invoice.id,
        checkoutRequestId,
        resultCode: callback.ResultCode,
        resultDesc: callback.ResultDesc,
      });

      revalidatePath("/portal/invoices");
      revalidatePath("/admin/invoices");
    }
  } catch (err) {
    await logError("mpesa_callback", err, {
      invoiceId: invoice.id,
      checkoutRequestId,
      payload,
    });
  }

  return acceptedResponse();
}
