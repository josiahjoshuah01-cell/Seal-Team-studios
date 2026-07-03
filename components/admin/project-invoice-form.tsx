"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/invoices";
import { createInvoice } from "@/lib/admin/actions/invoices";

type Props = {
  clientId: string;
  projectId: string;
};

export function ProjectInvoiceForm({ clientId, projectId }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: clientId,
      project_id: projectId,
      amount: 0,
      currency: "KES",
      description: "",
    },
  });

  async function onSubmit(data: InvoiceInput) {
    const result = await createInvoice({
      ...data,
      client_id: clientId,
      project_id: projectId,
    });

    if (!result.success) {
      toast.error(result.error ?? "Failed to create invoice");
      return;
    }

    toast.success("Invoice created");
    reset({
      client_id: clientId,
      project_id: projectId,
      amount: 0,
      currency: "KES",
      description: "",
    });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" error={errors.amount?.message}>
          <input
            type="number"
            min="1"
            step="1"
            className={inputClass}
            {...register("amount", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Currency" error={errors.currency?.message}>
          <input className={inputClass} {...register("currency")} />
        </Field>
      </div>
      <Field label="Description (optional)" error={errors.description?.message}>
        <input
          className={inputClass}
          placeholder="Balance payment, add-on, reshoot, etc."
          {...register("description")}
        />
      </Field>
      <button type="submit" disabled={isSubmitting} className={btnClass}>
        {isSubmitting ? "Creating…" : "Create invoice"}
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
