"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { logError } from "@/lib/logger";
import {
  availabilitySlotSchema,
  type AvailabilitySlotInput,
} from "@/lib/validations/availability";
import { normalizeTime, timesOverlap, todayDateString } from "@/lib/utils/time";

export type AvailabilityWithBooking = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
  booking: {
    id: string;
    status: string;
    client_name: string;
  } | null;
  pending_count: number;
};

async function findOverlappingSlot(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
) {
  let query = supabase
    .from("availability")
    .select("id, start_time, end_time")
    .eq("date", date);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).find((slot) =>
    timesOverlap(slot.start_time, slot.end_time, startTime, endTime)
  );
}

export async function getAvailabilitySlots() {
  const { supabase } = await requireAdmin();

  const { data: slots, error } = await supabase
    .from("availability")
    .select("id, date, start_time, end_time, is_booked, created_at")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;

  const slotIds = (slots ?? []).map((s) => s.id);
  let bookingMap = new Map<
    string,
    { id: string; status: string; client_id: string | null }
  >();
  let pendingCounts = new Map<string, number>();

  if (slotIds.length > 0) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, availability_id, status, client_id")
      .in("availability_id", slotIds)
      .in("status", ["pending", "confirmed", "completed"]);

    for (const booking of bookings ?? []) {
      if (!booking.availability_id) continue;

      if (booking.status === "pending") {
        pendingCounts.set(
          booking.availability_id,
          (pendingCounts.get(booking.availability_id) ?? 0) + 1
        );
      }

      if (
        booking.status === "confirmed" ||
        booking.status === "completed"
      ) {
        bookingMap.set(booking.availability_id, booking);
      }
    }
  }

  const clientIds = [
    ...new Set(
      [...bookingMap.values()]
        .map((b) => b.client_id)
        .filter(Boolean) as string[]
    ),
  ];

  let clientMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .in("id", clientIds);
    clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
  }

  return (slots ?? []).map((slot) => {
    const activeBooking = bookingMap.get(slot.id);
    return {
      ...slot,
      booking: activeBooking
        ? {
            id: activeBooking.id,
            status: activeBooking.status,
            client_name: activeBooking.client_id
              ? clientMap.get(activeBooking.client_id) ?? "—"
              : "—",
          }
        : null,
      pending_count: pendingCounts.get(slot.id) ?? 0,
    } satisfies AvailabilityWithBooking;
  });
}

export async function createAvailabilitySlot(input: AvailabilitySlotInput) {
  try {
    const parsed = availabilitySlotSchema.parse(input);
    const { supabase } = await requireAdmin();

    if (parsed.date < todayDateString()) {
      return { success: false, error: "Cannot add slots in the past" };
    }

    const overlap = await findOverlappingSlot(
      supabase,
      parsed.date,
      parsed.start_time,
      parsed.end_time
    );

    if (overlap) {
      return {
        success: false,
        error: "This slot overlaps with an existing slot on the same date",
      };
    }

    const { error } = await supabase.from("availability").insert({
      date: parsed.date,
      start_time: normalizeTime(parsed.start_time),
      end_time: normalizeTime(parsed.end_time),
    });

    if (error) throw error;

    revalidatePath("/admin/availability");
    revalidatePath("/booking");
    return { success: true };
  } catch (err) {
    await logError("admin_availability_create", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to create availability slot",
    };
  }
}

export async function deleteAvailabilitySlot(id: string) {
  try {
    const { supabase } = await requireAdmin();

    const { data: slot, error: fetchError } = await supabase
      .from("availability")
      .select("id, is_booked")
      .eq("id", id)
      .single();

    if (fetchError || !slot) {
      return { success: false, error: "Slot not found" };
    }

    if (slot.is_booked) {
      return {
        success: false,
        error: "Cannot delete a booked slot. Cancel the booking first.",
      };
    }

    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("availability_id", id)
      .in("status", ["pending", "confirmed"]);

    if ((activeBookings?.length ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete a slot with active booking requests.",
      };
    }

    const { error } = await supabase.from("availability").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/availability");
    revalidatePath("/booking");
    return { success: true };
  } catch (err) {
    await logError("admin_availability_delete", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to delete availability slot",
    };
  }
}
