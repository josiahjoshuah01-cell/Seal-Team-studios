"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clientSchema, type ClientInput } from "@/lib/validations/admin";
import { createClient, updateClient } from "@/lib/admin/actions/clients";

type Props = {
  client?: ClientInput & { id?: string };
};

export function ClientForm({ client }: Props) {
  const router = useRouter();
  const isEdit = Boolean(client?.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ?? { name: "", email: "", phone: "", notes: "" },
  });

  async function onSubmit(data: ClientInput) {
    const result = isEdit
      ? await updateClient(client!.id!, data)
      : await createClient(data);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success(isEdit ? "Client updated" : "Client created");
    router.push(isEdit ? `/admin/clients/${client!.id}` : "/admin/clients");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <Field label="Name" error={errors.name?.message}>
        <input className={inputClass} {...register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" className={inputClass} {...register("email")} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <input className={inputClass} {...register("phone")} />
      </Field>
      <Field label="Notes" error={errors.notes?.message}>
        <textarea rows={3} className={inputClass} {...register("notes")} />
      </Field>
      <button type="submit" disabled={isSubmitting} className={btnClass}>
        {isSubmitting ? "Saving…" : isEdit ? "Update client" : "Create client"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";
const btnClass =
  "rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";
