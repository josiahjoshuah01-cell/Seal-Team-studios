import { z } from "zod";

export const bookingRequestSchema = z.object({
  service_id: z.string().uuid("Select a service"),
  availability_id: z.string().uuid("Select a time slot"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
