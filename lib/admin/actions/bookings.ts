"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { logError } from "@/lib/logger";
import { notifyBookingConfirmed } from "@/lib/emails/notify";
import { bookingStatusSchema } from "@/lib/validations/booking";

export type AdminBooking = {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  client_id: string | null;
  client_name: string;
  client_email: string;
  service_id: string | null;
  service_name: string;
  service_price: number | null;
  availability_id: string | null;
  slot_date: string | null;
  slot_start: string | null;
  slot_end: string | null;
  project_id: string | null;
};

export async function getBookings(status?: string) {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("bookings")
    .select(
      "id, status, notes, created_at, client_id, service_id, availability_id"
    )
    .order("created_at", { ascending: false });

  if (status && bookingStatusSchema.safeParse(status).success) {
    query = query.eq("status", status as AdminBooking["status"]);
  }

  const { data: bookings, error } = await query;
  if (error) throw error;

  const clientIds = [
    ...new Set((bookings ?? []).map((b) => b.client_id).filter(Boolean)),
  ] as string[];
  const serviceIds = [
    ...new Set((bookings ?? []).map((b) => b.service_id).filter(Boolean)),
  ] as string[];
  const availabilityIds = [
    ...new Set((bookings ?? []).map((b) => b.availability_id).filter(Boolean)),
  ] as string[];
  const bookingIds = (bookings ?? []).map((b) => b.id);

  const [clientsRes, servicesRes, availabilityRes, projectsRes] =
    await Promise.all([
      clientIds.length
        ? supabase.from("clients").select("id, name, email").in("id", clientIds)
        : Promise.resolve({ data: [] }),
      serviceIds.length
        ? supabase.from("services").select("id, name, price").in("id", serviceIds)
        : Promise.resolve({ data: [] }),
      availabilityIds.length
        ? supabase
            .from("availability")
            .select("id, date, start_time, end_time")
            .in("id", availabilityIds)
        : Promise.resolve({ data: [] }),
      bookingIds.length
        ? supabase
            .from("projects")
            .select("id, booking_id")
            .in("booking_id", bookingIds)
        : Promise.resolve({ data: [] }),
    ]);

  const clientMap = new Map(
    (clientsRes.data ?? []).map((c) => [c.id, { name: c.name, email: c.email }])
  );
  const serviceMap = new Map(
    (servicesRes.data ?? []).map((s) => [s.id, { name: s.name, price: s.price }])
  );
  const availabilityMap = new Map(
    (availabilityRes.data ?? []).map((a) => [a.id, a])
  );
  const projectMap = new Map(
    (projectsRes.data ?? []).map((p) => [p.booking_id, p.id])
  );

  const enriched = (bookings ?? []).map((booking) => {
    const client = booking.client_id
      ? clientMap.get(booking.client_id)
      : undefined;
    const slot = booking.availability_id
      ? availabilityMap.get(booking.availability_id)
      : undefined;

    return {
      id: booking.id,
      status: booking.status,
      notes: booking.notes,
      created_at: booking.created_at,
      client_id: booking.client_id,
      client_name: client?.name ?? "—",
      client_email: client?.email ?? "—",
      service_id: booking.service_id,
      service_name: booking.service_id
        ? serviceMap.get(booking.service_id)?.name ?? "—"
        : "—",
      service_price: booking.service_id
        ? serviceMap.get(booking.service_id)?.price != null
          ? Number(serviceMap.get(booking.service_id)!.price)
          : null
        : null,
      availability_id: booking.availability_id,
      slot_date: slot?.date ?? null,
      slot_start: slot?.start_time ?? null,
      slot_end: slot?.end_time ?? null,
      project_id: projectMap.get(booking.id) ?? null,
    } satisfies AdminBooking;
  });

  return enriched.sort((a, b) => {
    const dateA = a.slot_date ?? "9999-12-31";
    const dateB = b.slot_date ?? "9999-12-31";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.slot_start ?? "").localeCompare(b.slot_start ?? "");
  });
}

export async function getBooking(id: string) {
  const bookings = await getBookings();
  return bookings.find((b) => b.id === id) ?? null;
}

export async function confirmBooking(
  id: string,
  options: { createProject?: boolean; depositAmount?: number | null } = {}
) {
  const createProject = options.createProject ?? true;
  const depositAmount = options.depositAmount ?? null;

  try {
    const { supabase } = await requireAdmin();

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status, client_id, service_id, availability_id")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status !== "pending") {
      return { success: false, error: "Only pending bookings can be confirmed" };
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", id);

    if (bookingError) throw bookingError;

    if (booking.availability_id) {
      const { error: slotError } = await supabase
        .from("availability")
        .update({ is_booked: true })
        .eq("id", booking.availability_id);

      if (slotError) throw slotError;
    }

    let projectId: string | undefined;

    if (createProject && booking.client_id && booking.service_id) {
      const [{ data: client }, { data: service }, { data: slot }] =
        await Promise.all([
          supabase
            .from("clients")
            .select("name")
            .eq("id", booking.client_id)
            .single(),
          supabase
            .from("services")
            .select("name")
            .eq("id", booking.service_id)
            .single(),
          booking.availability_id
            ? supabase
                .from("availability")
                .select("date")
                .eq("id", booking.availability_id)
                .single()
            : Promise.resolve({ data: null }),
        ]);

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: booking.client_id,
          booking_id: booking.id,
          title: `${client?.name ?? "Client"} — ${service?.name ?? "Session"}`,
          shoot_date: slot?.date ?? null,
          status: "upcoming",
        })
        .select("id")
        .single();

      if (projectError) throw projectError;
      projectId = project.id;
    }

    let invoiceId: string | undefined;

    if (
      depositAmount != null &&
      depositAmount > 0 &&
      booking.client_id &&
      projectId
    ) {
      const { createDepositInvoice } = await import(
        "@/lib/admin/actions/invoices"
      );
      const invoiceResult = await createDepositInvoice({
        clientId: booking.client_id,
        projectId,
        amount: depositAmount,
      });

      if (!invoiceResult.success) {
        throw new Error(invoiceResult.error ?? "Failed to create deposit invoice");
      }

      invoiceId = invoiceResult.id;
    }

    void notifyBookingConfirmed(id);

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath("/admin/availability");
    revalidatePath("/admin/projects");
    revalidatePath("/admin/invoices");
    revalidatePath("/booking");
    revalidatePath("/portal/invoices");

    return { success: true, projectId, invoiceId };
  } catch (err) {
    await logError("admin_booking_confirm", err, { id });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to confirm booking",
    };
  }
}

export async function cancelBooking(id: string) {
  try {
    const { supabase } = await requireAdmin();

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status, availability_id")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status === "cancelled") {
      return { success: false, error: "Booking is already cancelled" };
    }

    const wasConfirmed =
      booking.status === "confirmed" || booking.status === "completed";

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (bookingError) throw bookingError;

    if (wasConfirmed && booking.availability_id) {
      const { error: slotError } = await supabase
        .from("availability")
        .update({ is_booked: false })
        .eq("id", booking.availability_id);

      if (slotError) throw slotError;
    }

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath("/admin/availability");
    revalidatePath("/booking");

    return { success: true };
  } catch (err) {
    await logError("admin_booking_cancel", err, { id });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel booking",
    };
  }
}

export async function completeBooking(id: string) {
  try {
    const { supabase } = await requireAdmin();

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status !== "confirmed") {
      return {
        success: false,
        error: "Only confirmed bookings can be marked completed",
      };
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);

    return { success: true };
  } catch (err) {
    await logError("admin_booking_complete", err, { id });
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to mark booking completed",
    };
  }
}
