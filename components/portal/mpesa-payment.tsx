"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 3500;
const POLL_TIMEOUT_MS = 90_000;

type MpesaState = "idle" | "waiting" | "timeout";

type Props = {
  invoiceId: string;
  defaultPhone?: string | null;
  onClose: () => void;
};

export function MpesaPayment({ invoiceId, defaultPhone, onClose }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [state, setState] = useState<MpesaState>("idle");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current = null;
    timeoutRef.current = null;
  }

  useEffect(() => () => clearPolling(), []);

  async function checkStatus() {
    const response = await fetch(
      `/api/portal/invoices/status?invoice_id=${invoiceId}`
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { status: string };
    return data.status;
  }

  async function pollOnce() {
    const status = await checkStatus();

    if (status === "paid") {
      clearPolling();
      setState("idle");
      toast.success("M-Pesa payment successful");
      onClose();
      router.refresh();
      return;
    }

    if (status === "failed") {
      clearPolling();
      setState("idle");
      toast.error("M-Pesa payment failed or was cancelled");
      onClose();
      router.refresh();
    }
  }

  function startPolling() {
    clearPolling();
    setState("waiting");

    pollRef.current = setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      clearPolling();
      setState("timeout");
    }, POLL_TIMEOUT_MS);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!phone.trim()) {
      toast.error("Enter your M-Pesa phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: invoiceId,
          phone_number: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Unable to start M-Pesa payment");
        return;
      }

      toast.message(data.customerMessage ?? "Check your phone to complete payment");
      startPolling();
    } catch {
      toast.error("Unable to start M-Pesa payment");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecheck() {
    const status = await checkStatus();

    if (status === "paid") {
      toast.success("Payment confirmed");
      onClose();
      router.refresh();
      return;
    }

    if (status === "failed") {
      toast.error("Payment failed or was cancelled");
      setState("idle");
      router.refresh();
      return;
    }

    toast.message("Still pending — complete the prompt on your phone");
  }

  if (state === "waiting") {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">
          Check your phone to complete payment
        </p>
        <p className="text-sm text-muted-foreground">
          An M-Pesa prompt was sent to {phone}. Enter your PIN to approve.
        </p>
        <p className="text-xs text-muted-foreground">Waiting for confirmation…</p>
      </div>
    );
  }

  if (state === "timeout") {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">Still waiting?</p>
        <p className="text-sm text-muted-foreground">
          We haven&apos;t received confirmation yet. If you completed the payment on
          your phone, check again below.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRecheck}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Check again
          </button>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          M-Pesa phone number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0712345678"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Safaricom number in 07… or 2547… format
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Pay with M-Pesa"}
      </button>
    </form>
  );
}
