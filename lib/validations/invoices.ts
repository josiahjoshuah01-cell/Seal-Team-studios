import { z } from "zod";

export const invoiceSchema = z.object({
  client_id: z.string().uuid("Client is required"),
  project_id: z.string().uuid().optional().nullable(),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().min(3).max(3),
  description: z.string().optional(),
});

export const invoiceStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const confirmBookingSchema = z.object({
  createProject: z.boolean(),
  depositAmount: z.coerce
    .number()
    .positive("Deposit must be greater than zero")
    .optional()
    .nullable(),
});
