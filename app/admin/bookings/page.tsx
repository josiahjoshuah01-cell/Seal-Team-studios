import Link from "next/link";
import { Suspense } from "react";
import { getBookings } from "@/lib/admin/actions/bookings";
import { AdminPageHeader } from "@/components/admin/page-header";
import { BookingStatusFilter } from "@/components/admin/booking-status-filter";
import { BookingActions } from "@/components/admin/booking-actions";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export const metadata = { title: "Bookings" };

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const bookings = await getBookings(status);

  return (
    <div>
      <AdminPageHeader
        title="Bookings"
        description="Review and manage booking requests."
        action={{ label: "Manage availability", href: "/admin/availability" }}
      />

      <Suspense fallback={null}>
        <BookingStatusFilter />
      </Suspense>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Client</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Service</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Slot</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {booking.client_name}
                    </Link>
                    <p className="text-muted-foreground">{booking.client_email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{booking.service_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.slot_date && booking.slot_start && booking.slot_end
                      ? formatDateTime(
                          booking.slot_date,
                          booking.slot_start,
                          booking.slot_end
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <BookingActions
                      bookingId={booking.id}
                      status={booking.status}
                      servicePrice={booking.service_price}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "confirmed" | "completed" | "cancelled";
}) {
  const styles = {
    pending: "bg-muted text-muted-foreground",
    confirmed: "bg-accent/15 text-accent-foreground",
    completed: "bg-muted text-foreground",
    cancelled: "border border-border text-muted-foreground",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
