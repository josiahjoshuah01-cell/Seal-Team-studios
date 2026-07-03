import { z } from "zod";

export const videoDeliveryMethodSchema = z.enum([
  "cloudflare",
  "whatsapp",
  "not_applicable",
]);

export const videoDeliverySchema = z.object({
  video_delivery_method: videoDeliveryMethodSchema,
  video_delivery_notes: z.string().optional(),
});

export type VideoDeliveryInput = z.infer<typeof videoDeliverySchema>;
