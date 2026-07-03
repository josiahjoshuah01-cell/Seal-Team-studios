import { createElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminNotificationEmail } from "@/lib/emails/config";
import { sendEmail } from "@/lib/emails/send";
import { BookingReceivedEmail } from "@/lib/emails/templates/booking-received";
import { BookingConfirmedEmail } from "@/lib/emails/templates/booking-confirmed";
import { NewBookingNotificationEmail } from "@/lib/emails/templates/new-booking-notification";
import { GalleryPublishedEmail } from "@/lib/emails/templates/gallery-published";
import { InvoiceCreatedEmail } from "@/lib/emails/templates/invoice-created";
import { PaymentReceiptEmail } from "@/lib/emails/templates/payment-receipt";
import { PaymentFailedEmail } from "@/lib/emails/templates/payment-failed";
import { ContactFormReceivedEmail } from "@/lib/emails/templates/contact-form-received";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

function amountLabel(amount: number, currency: string) {
  return formatCurrency(amount, currency);
}

async function getBookingContext(bookingId: string) {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, notes, client_id, service_id, availability_id")
    .eq("id", bookingId)
    .single();

  if (!booking?.client_id) return null;

  const [{ data: client }, { data: service }, { data: slot }] = await Promise.all([
    supabase
      .from("clients")
      .select("name, email")
      .eq("id", booking.client_id)
      .single(),
    booking.service_id
      ? supabase.from("services").select("name").eq("id", booking.service_id).single()
      : Promise.resolve({ data: null }),
    booking.availability_id
      ? supabase
          .from("availability")
          .select("date, start_time, end_time")
          .eq("id", booking.availability_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!client?.email) return null;

  const slotLabel = slot
    ? formatDateTime(slot.date, slot.start_time, slot.end_time)
    : "TBD";

  return {
    clientName: client.name,
    clientEmail: client.email,
    serviceName: service?.name ?? "Session",
    slotLabel,
    notes: booking.notes,
  };
}

export async function notifyBookingReceived(bookingId: string) {
  const context = await getBookingContext(bookingId);
  if (!context) return;

  await sendEmail({
    to: context.clientEmail,
    subject: "We received your booking request",
    react: createElement(BookingReceivedEmail, {
      clientName: context.clientName,
      serviceName: context.serviceName,
      slotLabel: context.slotLabel,
    }),
    tags: [{ name: "template", value: "booking_received" }],
  });

  const adminEmail = getAdminNotificationEmail();
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    subject: `New booking request — ${context.clientName}`,
    react: createElement(NewBookingNotificationEmail, {
      clientName: context.clientName,
      clientEmail: context.clientEmail,
      serviceName: context.serviceName,
      slotLabel: context.slotLabel,
      notes: context.notes,
    }),
    tags: [{ name: "template", value: "new_booking_notification" }],
  });
}

export async function notifyBookingConfirmed(bookingId: string) {
  const context = await getBookingContext(bookingId);
  if (!context) return;

  await sendEmail({
    to: context.clientEmail,
    subject: "Your booking is confirmed",
    react: createElement(BookingConfirmedEmail, {
      clientName: context.clientName,
      serviceName: context.serviceName,
      slotLabel: context.slotLabel,
    }),
    tags: [{ name: "template", value: "booking_confirmed" }],
  });
}

export async function notifyInvoiceCreated(invoiceId: string) {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, amount, currency, description, client_id, project_id")
    .eq("id", invoiceId)
    .single();

  if (!invoice?.client_id) return;

  const [{ data: client }, { data: project }] = await Promise.all([
    supabase
      .from("clients")
      .select("name, email")
      .eq("id", invoice.client_id)
      .single(),
    invoice.project_id
      ? supabase.from("projects").select("title").eq("id", invoice.project_id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!client?.email) return;

  await sendEmail({
    to: client.email,
    subject: `New invoice — ${amountLabel(Number(invoice.amount), invoice.currency)}`,
    react: createElement(InvoiceCreatedEmail, {
      clientName: client.name,
      amountLabel: amountLabel(Number(invoice.amount), invoice.currency),
      description: invoice.description,
      projectTitle: project?.title ?? null,
    }),
    tags: [{ name: "template", value: "invoice_created" }],
  });
}

export async function notifyPaymentReceipt(invoiceId: string) {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("amount, currency, payment_method, payment_reference, client_id")
    .eq("id", invoiceId)
    .single();

  if (!invoice?.client_id) return;

  const { data: client } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", invoice.client_id)
    .single();

  if (!client?.email) return;

  const method =
    invoice.payment_method === "paypal"
      ? "PayPal"
      : invoice.payment_method === "mpesa"
        ? "M-Pesa"
        : invoice.payment_method === "manual"
          ? "Manual payment"
          : "Payment";

  await sendEmail({
    to: client.email,
    subject: `Payment receipt — ${amountLabel(Number(invoice.amount), invoice.currency)}`,
    react: createElement(PaymentReceiptEmail, {
      clientName: client.name,
      amountLabel: amountLabel(Number(invoice.amount), invoice.currency),
      paymentMethod: method,
      reference: invoice.payment_reference,
    }),
    tags: [{ name: "template", value: "payment_receipt" }],
  });
}

export async function notifyPaymentFailed(invoiceId: string, reason?: string | null) {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("amount, currency, client_id")
    .eq("id", invoiceId)
    .single();

  if (!invoice?.client_id) return;

  const { data: client } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", invoice.client_id)
    .single();

  if (!client?.email) return;

  await sendEmail({
    to: client.email,
    subject: "M-Pesa payment not completed",
    react: createElement(PaymentFailedEmail, {
      clientName: client.name,
      amountLabel: amountLabel(Number(invoice.amount), invoice.currency),
      reason,
    }),
    tags: [{ name: "template", value: "payment_failed" }],
  });
}

export async function notifyGalleryPublished(galleryId: string) {
  const supabase = createAdminClient();

  const { data: gallery } = await supabase
    .from("galleries")
    .select("id, title, project_id, is_public, published_notified_at")
    .eq("id", galleryId)
    .single();

  if (!gallery?.is_public || gallery.published_notified_at || !gallery.project_id) {
    return;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("title, client_id")
    .eq("id", gallery.project_id)
    .single();

  if (!project?.client_id) return;

  const { data: client } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", project.client_id)
    .single();

  if (!client?.email) return;

  const result = await sendEmail({
    to: client.email,
    subject: `Your gallery "${gallery.title}" is ready`,
    react: createElement(GalleryPublishedEmail, {
      clientName: client.name,
      galleryTitle: gallery.title,
      projectTitle: project.title,
    }),
    tags: [{ name: "template", value: "gallery_published" }],
  });

  if (result.success) {
    await supabase
      .from("galleries")
      .update({ published_notified_at: new Date().toISOString() })
      .eq("id", galleryId);
  }
}

export async function notifyContactFormReceived(input: {
  name: string;
  email: string;
  message: string;
}) {
  const adminEmail = getAdminNotificationEmail();
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    subject: `Contact form — ${input.name}`,
    react: createElement(ContactFormReceivedEmail, input),
    tags: [{ name: "template", value: "contact_form_received" }],
  });
}
