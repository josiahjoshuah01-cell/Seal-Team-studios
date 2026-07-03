"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { MpesaPayment } from "@/components/portal/mpesa-payment";
import type { PortalInvoice } from "@/lib/portal/invoices";

type PaymentMethod = "paypal" | "mpesa" | null;

type Props = {
  invoices: PortalInvoice[];
  paypalClientId: string;
  paypalEnabled: boolean;
  mpesaEnabled: boolean;
  defaultPhone?: string | null;
};

export function PortalInvoicesList({
  invoices,
  paypalClientId,
  paypalEnabled,
  mpesaEnabled,
  defaultPhone,
}: Props) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const router = useRouter();

  function closePayment() {
    setPayingId(null);
    setPaymentMethod(null);
  }

  if (invoices.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        No invoices yet. They&apos;ll appear here when your studio sends one.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {invoices.map((invoice) => (
        <article
          key={invoice.id}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-medium text-foreground">
                {formatCurrency(invoice.amount, invoice.currency)}
              </p>
              {invoice.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {invoice.description}
                </p>
              )}
              {invoice.project_title && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Project: {invoice.project_title}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Issued {formatDate(invoice.created_at)}
              </p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          {invoice.status === "pending" && (
            <div className="mt-4 border-t border-border pt-4">
              {payingId === invoice.id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Pay invoice</p>
                    <button
                      type="button"
                      onClick={closePayment}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Close
                    </button>
                  </div>

                  {!paymentMethod && (
                    <div className="flex flex-wrap gap-2">
                      {paypalEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("paypal")}
                          className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          PayPal
                        </button>
                      )}
                      {mpesaEnabled && invoice.currency === "KES" && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("mpesa")}
                          className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          M-Pesa
                        </button>
                      )}
                      {!paypalEnabled && !mpesaEnabled && (
                        <p className="text-sm text-muted-foreground">
                          Online payment is not configured yet. Contact the studio.
                        </p>
                      )}
                    </div>
                  )}

                  {paymentMethod === "paypal" && paypalEnabled && paypalClientId && (
                    <PayPalScriptProvider
                      options={{
                        clientId: paypalClientId,
                        currency: invoice.currency,
                        intent: "capture",
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect" }}
                        createOrder={async () => {
                          const response = await fetch(
                            "/api/payments/paypal/create-order",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ invoice_id: invoice.id }),
                            }
                          );

                          const data = await response.json();
                          if (!response.ok) {
                            throw new Error(data.error ?? "Unable to start payment");
                          }

                          return data.orderId;
                        }}
                        onApprove={async (data) => {
                          const response = await fetch(
                            "/api/payments/paypal/capture-order",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                invoice_id: invoice.id,
                                order_id: data.orderID,
                              }),
                            }
                          );

                          const result = await response.json();
                          if (!response.ok) {
                            toast.error(result.error ?? "Payment failed");
                            return;
                          }

                          toast.success("Payment successful");
                          closePayment();
                          router.refresh();
                        }}
                        onError={() => {
                          toast.error("PayPal payment failed");
                        }}
                      />
                    </PayPalScriptProvider>
                  )}

                  {paymentMethod === "mpesa" && mpesaEnabled && (
                    <MpesaPayment
                      invoiceId={invoice.id}
                      defaultPhone={defaultPhone}
                      onClose={closePayment}
                    />
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPayingId(invoice.id);
                    setPaymentMethod(null);
                  }}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Pay now
                </button>
              )}
            </div>
          )}

          {invoice.status === "paid" && invoice.payment_reference && (
            <p className="mt-3 text-xs text-muted-foreground">
              Ref: {invoice.payment_reference}
              {invoice.payment_method ? ` · ${invoice.payment_method}` : ""}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: PortalInvoice["status"] }) {
  const styles = {
    pending: "bg-muted text-muted-foreground",
    paid: "bg-accent/15 text-accent-foreground",
    failed: "border border-border text-destructive",
    refunded: "border border-border text-muted-foreground",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
