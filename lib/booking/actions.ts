"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import {
  bookingRequestSchema,
  type BookingRequestInput,
} from "@/lib/validations/booking";
import { notifyBookingReceived } from "@/lib/emails/notify";

function publicError(err: unknown) {
  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    return err.message;
  }
  return "Unable to submit booking request. Please try again.";
}

export async function createBookingRequest(input: BookingRequestInput) {
  try {
    const parsed = bookingRequestSchema.parse(input);
    const supabase = createAdminClient();

    const { data: slot, error: slotError } = await supabase
      .from("availability")
      .select("id, date, is_booked")
      .eq("id", parsed.availability_id)
      .single();

    if (slotError || !slot) {
      return { success: false, error: "Selected time slot is no longer available." };
    }

    if (slot.is_booked) {
      return {
        success: false,
        error: "That slot was just taken. Please choose another time.",
      };
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, is_active")
      .eq("id", parsed.service_id)
      .single();

    if (serviceError || !service?.is_active) {
      return { success: false, error: "Selected service is not available." };
    }

    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("email", parsed.email.toLowerCase())
      .maybeSingle();

    let clientId = existingClient?.id;

    if (!clientId) {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: parsed.name,
          email: parsed.email.toLowerCase(),
          phone: parsed.phone || null,
          notes: parsed.notes || null,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;
      clientId = newClient.id;
    } else {
      await supabase
        .from("clients")
        .update({
          name: parsed.name,
          phone: parsed.phone || null,
        })
        .eq("id", clientId);
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        client_id: clientId,
        service_id: parsed.service_id,
        availability_id: parsed.availability_id,
        status: "pending",
        notes: parsed.notes || null,
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;

    void notifyBookingReceived(booking.id);

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/availability");
    revalidatePath("/booking");

    return { success: true, id: booking.id };
  } catch (err) {
    await logError("booking_create", err, { input });
    return { success: false, error: publicError(err) };
  }
}
