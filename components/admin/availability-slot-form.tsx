"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  availabilitySlotSchema,
  type AvailabilitySlotInput,
} from "@/lib/validations/availability";
import { createAvailabilitySlot } from "@/lib/admin/actions/availability";
import { todayDateString } from "@/lib/utils/time";

export function AvailabilitySlotForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilitySlotInput>({
    resolver: zodResolver(availabilitySlotSchema),
    defaultValues: {
      date: todayDateString(),
      start_time: "09:00",
      end_time: "10:00",
    },
  });

  async function onSubmit(data: AvailabilitySlotInput) {
    const result = await createAvailabilitySlot(data);

    if (!result.success) {
      toast.error(result.error ?? "Failed to add slot");
      return;
    }

    toast.success("Availability slot added");
    reset({ date: data.date, start_time: "09:00", end_time: "10:00" });
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-lg font-medium text-foreground">Add slot</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Open time windows visitors can request when booking.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Date" error={errors.date?.message}>
          <input
            type="date"
            min={todayDateString()}
            className={inputClass}
            {...register("date")}
          />
        </Field>
        <Field label="Start" error={errors.start_time?.message}>
          <input type="time" className={inputClass} {...register("start_time")} />
        </Field>
        <Field label="End" error={errors.end_time?.message}>
          <input type="time" className={inputClass} {...register("end_time")} />
        </Field>
      </div>

      <button type="submit" disabled={isSubmitting} className={`${btnClass} mt-4`}>
        {isSubmitting ? "Adding…" : "Add slot"}
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
