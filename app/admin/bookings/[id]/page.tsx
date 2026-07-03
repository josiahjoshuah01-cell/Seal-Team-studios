import Link from "next/link";
import { notFound } from "next/navigation";
import { getBooking } from "@/lib/admin/actions/bookings";
import { AdminPageHeader } from "@/components/admin/page-header";
import { BookingActions } from "@/components/admin/booking-actions";
import { formatDate, formatDateTime } from "@/lib/utils/format";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const booking = await getBooking(id);
  return { title: booking ? `Booking — ${booking.client_name}` : "Booking" };
}

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) notFound();

  return (
    <div>
      <AdminPageHeader
        title={booking.client_name}
        description={`Booking request · ${booking.status}`}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-medium text-foreground">Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Status" value={booking.status} capitalize />
              <Row label="Service" value={booking.service_name} />
              <Row
                label="Slot"
                value={
                  booking.slot_date && booking.slot_start && booking.slot_end
                    ? formatDateTime(
                        booking.slot_date,
                        booking.slot_start,
                        booking.slot_end
                      )
                    : "—"
                }
              />
              <Row label="Requested" value={formatDate(booking.created_at)} />
              {booking.notes && <Row label="Notes" value={booking.notes} />}
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-medium text-foreground">Client</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Name" value={booking.client_name} />
              <Row label="Email" value={booking.client_email} />
            </dl>
            {booking.client_id && (
              <Link
                href={`/admin/clients/${booking.client_id}`}
                className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
              >
                View client record →
              </Link>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-medium text-foreground">Actions</h2>
            <div className="mt-4">
              <BookingActions
                bookingId={booking.id}
                status={booking.status}
                servicePrice={booking.service_price}
              />
            </div>
          </section>

          {booking.project_id && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-medium text-foreground">Project</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                A project was created when this booking was confirmed.
              </p>
              <Link
                href={`/admin/projects/${booking.project_id}`}
                className="mt-4 inline-block text-sm font-medium text-foreground hover:underline"
              >
                View project →
              </Link>
            </section>
          )}

          <Link
            href="/admin/bookings"
            className="block text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to bookings
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right text-foreground ${capitalize ? "capitalize" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
