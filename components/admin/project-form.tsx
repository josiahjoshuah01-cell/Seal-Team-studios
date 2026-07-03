"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { projectSchema, type ProjectInput } from "@/lib/validations/admin";
import { createProject, updateProject } from "@/lib/admin/actions/projects";

type ClientOption = { id: string; name: string };

type Props = {
  project?: ProjectInput & { id?: string };
  clients: ClientOption[];
};

export function ProjectForm({ project, clients }: Props) {
  const router = useRouter();
  const isEdit = Boolean(project?.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ?? {
      client_id: "",
      title: "",
      type: "",
      shoot_date: "",
      status: "upcoming",
    },
  });

  async function onSubmit(data: ProjectInput) {
    const result = isEdit
      ? await updateProject(project!.id!, data)
      : await createProject(data);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success(isEdit ? "Project updated" : "Project created");
    router.push(isEdit ? `/admin/projects/${project!.id}` : "/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Client</label>
        <select className={inputClass} {...register("client_id")}>
          <option value="">Select client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.client_id && (
          <p className="mt-1 text-sm text-destructive">{errors.client_id.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input className={inputClass} {...register("title")} />
        {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Type</label>
        <select className={inputClass} {...register("type")}>
          <option value="">—</option>
          <option value="wedding">Wedding</option>
          <option value="portrait">Portrait</option>
          <option value="commercial">Commercial</option>
          <option value="event">Event</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Shoot date</label>
        <input type="date" className={inputClass} {...register("shoot_date")} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select className={inputClass} {...register("status")}>
          <option value="upcoming">Upcoming</option>
          <option value="shot">Shot</option>
          <option value="editing">Editing</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <button type="submit" disabled={isSubmitting} className={btnClass}>
        {isSubmitting ? "Saving…" : isEdit ? "Update project" : "Create project"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";
const btnClass =
  "rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";
