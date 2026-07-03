import { getAvailabilitySlots } from "@/lib/admin/actions/availability";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AvailabilitySlotForm } from "@/components/admin/availability-slot-form";
import { AvailabilityList } from "@/components/admin/availability-list";

export const metadata = { title: "Availability" };

export default async function AdminAvailabilityPage() {
  const slots = await getAvailabilitySlots();

  return (
    <div>
      <AdminPageHeader
        title="Availability"
        description="Define open time slots for public booking requests."
        action={{ label: "View bookings", href: "/admin/bookings" }}
      />

      <div className="mb-10">
        <AvailabilitySlotForm />
      </div>

      <AvailabilityList slots={slots} />
    </div>
  );
}
