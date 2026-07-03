"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  markVideoDeliveredViaWhatsApp,
  updateVideoDelivery,
} from "@/lib/admin/actions/projects";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { formatDate } from "@/lib/utils/format";

type Gallery = { id: string; title: string };

type Props = {
  projectId: string;
  clientPhone?: string | null;
  galleries: Gallery[];
  delivery: {
    video_delivery_method: "cloudflare" | "whatsapp" | "not_applicable";
    video_delivery_status: "not_sent" | "sent" | "not_applicable";
    video_delivered_at: string | null;
    video_delivery_notes: string | null;
  };
};

export function VideoDeliveryPanel({
  projectId,
  clientPhone,
  galleries,
  delivery,
}: Props) {
  const router = useRouter();
  const [method, setMethod] = useState(delivery.video_delivery_method);
  const [notes, setNotes] = useState(delivery.video_delivery_notes ?? "");
  const [loading, setLoading] = useState(false);

  async function saveMethod(nextMethod: typeof method) {
    setMethod(nextMethod);
    setLoading(true);
    const result = await updateVideoDelivery(projectId, {
      video_delivery_method: nextMethod,
      video_delivery_notes: notes,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to save");
      setMethod(delivery.video_delivery_method);
      return;
    }

    toast.success("Delivery method updated");
    router.refresh();
  }

  async function handleMarkSent() {
    setLoading(true);
    const result = await markVideoDeliveredViaWhatsApp(projectId, notes);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update");
      return;
    }

    toast.success("Marked as sent via WhatsApp");
    router.refresh();
  }

  const whatsappUrl = clientPhone ? buildWhatsAppUrl(clientPhone) : null;

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-medium text-foreground">Video delivery</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose how final footage is delivered to this client.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["cloudflare", "Hosted in gallery (Cloudflare)"],
            ["whatsapp", "Delivered via WhatsApp"],
            ["not_applicable", "Not applicable"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={loading}
            onClick={() => saveMethod(value)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              method === value
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {method === "cloudflare" && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <p className="text-muted-foreground">
            Upload videos in the project&apos;s gallery. Manage media here:
          </p>
          {galleries.length === 0 ? (
            <p className="mt-2 text-muted-foreground">No galleries linked yet.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {galleries.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/admin/galleries/${g.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {method === "whatsapp" && (
        <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <DeliveryBadge status={delivery.video_delivery_status} />
            {delivery.video_delivered_at && (
              <span className="text-xs text-muted-foreground">
                · {formatDate(delivery.video_delivered_at)}
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent full ceremony + highlight reel, 2.1GB via WhatsApp document"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {delivery.video_delivery_status !== "sent" && (
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkSent}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                Mark as sent
              </button>
            )}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Open WhatsApp chat
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a phone number on the client record to enable the WhatsApp link.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DeliveryBadge({
  status,
}: {
  status: "not_sent" | "sent" | "not_applicable";
}) {
  const styles = {
    not_sent: "bg-muted text-muted-foreground",
    sent: "bg-accent/15 text-accent-foreground",
    not_applicable: "border border-border text-muted-foreground",
  } as const;

  const labels = {
    not_sent: "Not sent",
    sent: "Sent",
    not_applicable: "N/A",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
