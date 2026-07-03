"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  bookingRequestSchema,
  type BookingRequestInput,
} from "@/lib/validations/booking";
import { createBookingRequest } from "@/lib/booking/actions";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/format";
import type { Service } from "@/lib/data/services";
import type { OpenSlot } from "@/lib/data/availability";

type Props = {
  services: Service[];
  slots: OpenSlot[];
};

type Step = "service" | "slot" | "details" | "done";

export function BookingWizard({ services, slots }: Props) {
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const selectedSlot = slots.find((s) => s.id === slotId) ?? null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<BookingRequestInput>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: { name: "", email: "", phone: "", notes: "" },
  });

  const slotsByDate = slots.reduce<Record<string, OpenSlot[]>>((acc, slot) => {
    (acc[slot.date] ??= []).push(slot);
    return acc;
  }, {});

  const slotDates = Object.keys(slotsByDate).sort();

  function chooseService(id: string) {
    setServiceId(id);
    setValue("service_id", id);
    setStep("slot");
  }

  function chooseSlot(id: string) {
    setSlotId(id);
    setValue("availability_id", id);
    setStep("details");
  }

  async function onSubmit(data: BookingRequestInput) {
    if (!serviceId || !slotId) {
      toast.error("Please complete all booking steps");
      return;
    }

    const result = await createBookingRequest({
      ...data,
      service_id: serviceId,
      availability_id: slotId,
    });

    if (!result.success) {
      toast.error(result.error ?? "Unable to submit request");
      if (result.error?.includes("slot")) {
        setStep("slot");
        setSlotId(null);
      }
      return;
    }

    toast.success("Booking request submitted");
    setStep("done");
  }

  if (services.length === 0) {
    return (
      <p className="mt-8 text-muted-foreground">
        No services are available for booking right now. Please check back soon.
      </p>
    );
  }

  if (step === "done") {
    return (
      <div className="mt-8 max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">Request received</h2>
        <p className="mt-3 text-muted-foreground">
          Thanks{selectedService ? ` for your ${selectedService.name} request` : ""}.
          We&apos;ll confirm your booking within 1–2 business days.
        </p>
        {selectedSlot && (
          <p className="mt-2 text-sm text-muted-foreground">
            Requested: {formatDate(selectedSlot.date)},{" "}
            {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <StepIndicator step={step} />

      {step === "service" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => chooseService(service.id)}
              className="rounded-xl border border-border bg-card p-5 text-left transition-shadow hover:shadow-sm"
            >
              <h3 className="font-medium text-foreground">{service.name}</h3>
              {service.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {service.description}
                </p>
              )}
              {service.price != null && (
                <p className="mt-3 text-sm font-medium text-foreground">
                  {formatCurrency(Number(service.price))}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {step === "slot" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Service: <span className="text-foreground">{selectedService?.name}</span>
            </p>
            <button
              type="button"
              onClick={() => setStep("service")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Change service
            </button>
          </div>

          {slotDates.length === 0 ? (
            <p className="text-muted-foreground">
              No open slots right now. Please check back later or{" "}
              <a href="/contact" className="underline underline-offset-2">
                contact us
              </a>
              .
            </p>
          ) : (
            <div className="space-y-6">
              {slotDates.map((date) => (
                <section key={date}>
                  <h3 className="font-medium text-foreground">{formatDate(date)}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slotsByDate[date]!.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => chooseSlot(slot.id)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          slotId === slot.id
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "details" && selectedService && selectedSlot && (
        <div className="max-w-lg">
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p>
              <span className="text-muted-foreground">Service:</span>{" "}
              {selectedService.name}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">When:</span>{" "}
              {formatDate(selectedSlot.date)}, {formatTime(selectedSlot.start_time)} –{" "}
              {formatTime(selectedSlot.end_time)}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Name" error={errors.name?.message}>
              <input className={inputClass} {...register("name")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" className={inputClass} {...register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input type="tel" className={inputClass} {...register("phone")} />
            </Field>
            <Field label="Notes (optional)" error={errors.notes?.message}>
              <textarea rows={3} className={inputClass} {...register("notes")} />
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("slot")}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Back
              </button>
              <button type="submit" disabled={isSubmitting} className={btnClass}>
                {isSubmitting ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: "service", label: "Service" },
    { key: "slot", label: "Time" },
    { key: "details", label: "Details" },
  ] as const;

  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <ol className="mb-8 flex gap-4 text-sm">
      {steps.map((s, index) => (
        <li
          key={s.key}
          className={
            index <= currentIndex
              ? "font-medium text-foreground"
              : "text-muted-foreground"
          }
        >
          {index + 1}. {s.label}
        </li>
      ))}
    </ol>
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
