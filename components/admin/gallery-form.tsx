"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { gallerySchema, type GalleryInput } from "@/lib/validations/admin";
import { createGallery, updateGallery } from "@/lib/admin/actions/galleries";

type ProjectOption = { id: string; title: string };

type Props = {
  gallery?: GalleryInput & { id?: string };
  projects: ProjectOption[];
};

export function GalleryForm({ gallery, projects }: Props) {
  const router = useRouter();
  const isEdit = Boolean(gallery?.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GalleryInput>({
    resolver: zodResolver(gallerySchema),
    defaultValues: gallery ?? {
      project_id: "",
      title: "",
      is_public: false,
      expires_at: "",
    },
  });

  async function onSubmit(data: GalleryInput) {
    const payload = {
      ...data,
      expires_at: data.expires_at || null,
    };

    const result = isEdit
      ? await updateGallery(gallery!.id!, payload)
      : await createGallery(payload);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success(isEdit ? "Gallery updated" : "Gallery created");
    if (isEdit) {
      router.refresh();
    } else if ("id" in result && result.id) {
      router.push(`/admin/galleries/${result.id}`);
    } else {
      router.push("/admin/galleries");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Project</label>
        <select className={inputClass} {...register("project_id")}>
          <option value="">Select project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        {errors.project_id && (
          <p className="mt-1 text-sm text-destructive">{errors.project_id.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input className={inputClass} {...register("title")} />
        {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("is_public")} className="rounded border-input" />
        Public (visible on portfolio)
      </label>

      <div>
        <label className="mb-1 block text-sm font-medium">Expires at (optional)</label>
        <input type="datetime-local" className={inputClass} {...register("expires_at")} />
      </div>

      <button type="submit" disabled={isSubmitting} className={btnClass}>
        {isSubmitting ? "Saving…" : isEdit ? "Update gallery" : "Create gallery"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";
const btnClass =
  "rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";
