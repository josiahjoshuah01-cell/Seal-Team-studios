import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  profile_id: z.string().uuid().optional().nullable(),
});

export const projectSchema = z.object({
  client_id: z.string().uuid("Select a client"),
  title: z.string().min(2, "Title is required"),
  type: z.string().optional(),
  shoot_date: z.string().optional().nullable(),
  status: z.enum(["upcoming", "shot", "editing", "delivered"]),
  booking_id: z.string().uuid().optional().nullable(),
});

export const gallerySchema = z.object({
  project_id: z.string().uuid("Select a project"),
  title: z.string().min(2, "Title is required"),
  is_public: z.boolean(),
  expires_at: z.string().optional().nullable(),
});

export const mediaMetadataSchema = z.object({
  gallery_id: z.string().uuid(),
  storage_path: z.string().min(1),
  type: z.enum(["image", "video"]).default("image"),
  sort_order: z.number().int().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type GalleryInput = z.infer<typeof gallerySchema>;
