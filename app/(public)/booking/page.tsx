import { getActiveServices } from "@/lib/data/services";
import { getOpenAvailability } from "@/lib/data/availability";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata = { title: "Book a Session" };

export default async function BookingPage() {
  const [services, slots] = await Promise.all([
    getActiveServices(),
    getOpenAvailability(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Book a Session</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a service, pick an open time, and we&apos;ll confirm your booking shortly.
        </p>
      </div>

      <BookingWizard services={services} slots={slots} />
    </div>
  );
}
