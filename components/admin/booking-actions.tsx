"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
} from "@/lib/admin/actions/bookings";

type Props = {
  bookingId: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  servicePrice?: number | null;
  compact?: boolean;
};

export function BookingActions({
  bookingId,
  status,
  servicePrice,
  compact = false,
}: Props) {
  const router = useRouter();
  const [createProject, setCreateProject] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const suggestedDeposit = useMemo(() => {
    if (!servicePrice || servicePrice <= 0) return "";
    return String(Math.round(servicePrice * 0.3));
  }, [servicePrice]);

  function parseDepositAmount() {
    const trimmed = depositAmount.trim();
    if (!trimmed) return null;
    const value = Number(trimmed);
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return value;
  }

  async function handleConfirm() {
    const parsedDeposit = parseDepositAmount();
    if (depositAmount.trim() && parsedDeposit == null) {
      toast.error("Enter a valid deposit amount or leave it blank");
      return;
    }

    if (parsedDeposit && !createProject) {
      toast.error("A project is required to create a deposit invoice");
      return;
    }

    setLoading("confirm");
    const result = await confirmBooking(bookingId, {
      createProject,
      depositAmount: parsedDeposit,
    });
    setLoading(null);

    if (!result.success) {
      toast.error(result.error ?? "Failed to confirm booking");
      return;
    }

    const parts = ["Booking confirmed"];
    if (result.projectId) parts.push("project created");
    if (result.invoiceId) parts.push("deposit invoice created");
    toast.success(parts.join(", "));
    setShowConfirm(false);
    router.refresh();
  }

  async function handleCancel() {
    if (!confirm("Cancel this booking?")) return;

    setLoading("cancel");
    const result = await cancelBooking(bookingId);
    setLoading(null);

    if (!result.success) {
      toast.error(result.error ?? "Failed to cancel booking");
      return;
    }

    toast.success("Booking cancelled");
    router.refresh();
  }

  async function handleComplete() {
    setLoading("complete");
    const result = await completeBooking(bookingId);
    setLoading(null);

    if (!result.success) {
      toast.error(result.error ?? "Failed to complete booking");
      return;
    }

    toast.success("Booking marked completed");
    router.refresh();
  }

  if (status === "cancelled" || status === "completed") {
    return null;
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-4"}>
      {status === "pending" && (
        <div className={compact ? "contents" : "space-y-3"}>
          {!compact && showConfirm ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={createProject}
                  onChange={(e) => setCreateProject(e.target.checked)}
                  className="rounded border-input"
                />
                Auto-create project for this booking
              </label>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Deposit amount (KES)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={
                    suggestedDeposit
                      ? `Suggested: ${suggestedDeposit}`
                      : "Leave blank to skip"
                  }
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional. Creates a pending deposit invoice when confirmed.
                  {suggestedDeposit
                    ? ` Suggested 30%: KES ${suggestedDeposit}.`
                    : ""}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading === "confirm"}
                  className={primaryBtn}
                >
                  {loading === "confirm" ? "Confirming…" : "Confirm booking"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className={secondaryBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (compact) {
                  handleConfirm();
                } else {
                  setDepositAmount(suggestedDeposit);
                  setShowConfirm(true);
                }
              }}
              disabled={loading === "confirm"}
              className={primaryBtn}
            >
              {loading === "confirm" ? "Confirming…" : "Confirm"}
            </button>
          )}
        </div>
      )}

      {status === "confirmed" && (
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading === "complete"}
          className={primaryBtn}
        >
          {loading === "complete" ? "Saving…" : "Mark completed"}
        </button>
      )}

      <button
        type="button"
        onClick={handleCancel}
        disabled={loading === "cancel"}
        className={secondaryBtn}
      >
        {loading === "cancel" ? "Cancelling…" : "Cancel"}
      </button>
    </div>
  );
}

const primaryBtn =
  "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";
const secondaryBtn =
  "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50";
