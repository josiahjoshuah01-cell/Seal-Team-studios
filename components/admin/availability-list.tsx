"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteAvailabilitySlot,
  type AvailabilityWithBooking,
} from "@/lib/admin/actions/availability";
import { formatDate, formatTime } from "@/lib/utils/format";

type Props = {
  slots: AvailabilityWithBooking[];
};

export function AvailabilityList({ slots }: Props) {
  const router = useRouter();

  const grouped = slots.reduce<Record<string, AvailabilityWithBooking[]>>(
    (acc, slot) => {
      (acc[slot.date] ??= []).push(slot);
      return acc;
    },
    {}
  );

  const dates = Object.keys(grouped).sort();

  async function handleDelete(id: string) {
    if (!confirm("Delete this availability slot?")) return;

    const result = await deleteAvailabilitySlot(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete slot");
      return;
    }

    toast.success("Slot deleted");
    router.refresh();
  }

  if (dates.length === 0) {
    return (
      <p className="text-muted-foreground">
        No availability slots yet. Add your first slot above.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {dates.map((date) => (
        <section key={date}>
          <h2 className="text-lg font-medium text-foreground">{formatDate(date)}</h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {grouped[date]!.map((slot) => (
              <li
                key={slot.id}
                className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  slot.is_booked ? "bg-muted/40" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-foreground">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm">
                    {slot.is_booked && slot.booking ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent-foreground">
                        Booked ·{" "}
                        <Link
                          href={`/admin/bookings/${slot.booking.id}`}
                          className="underline underline-offset-2"
                        >
                          {slot.booking.client_name}
                        </Link>
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        Open
                      </span>
                    )}
                    {slot.pending_count > 0 && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                        {slot.pending_count} pending request
                        {slot.pending_count > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {!slot.is_booked && (
                  <button
                    type="button"
                    onClick={() => handleDelete(slot.id)}
                    className="self-start rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:self-center"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
