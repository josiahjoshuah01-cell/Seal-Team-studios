import { z } from "zod";

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

export const availabilitySlotSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => normalizeTime(data.end_time) > normalizeTime(data.start_time),
    { message: "End time must be after start time", path: ["end_time"] }
  );

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
