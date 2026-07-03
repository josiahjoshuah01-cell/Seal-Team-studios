/**
 * Manual email smoke test — run after setting RESEND_API_KEY in .env.local:
 *   npx tsx scripts/send-test-emails.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const {
    notifyBookingReceived,
    notifyBookingConfirmed,
    notifyInvoiceCreated,
    notifyPaymentReceipt,
    notifyPaymentFailed,
    notifyGalleryPublished,
    notifyContactFormReceived,
  } = await import("../lib/emails/notify");

  const bookingId = process.argv[2];
  const invoiceId = process.argv[3];
  const galleryId = process.argv[4];

  console.log("Sending ContactFormReceived...");
  await notifyContactFormReceived({
    name: "Test User",
    email: "test@example.com",
    message: "This is a test contact form submission from send-test-emails.",
  });

  if (bookingId) {
    console.log("Sending BookingReceived + admin notification...");
    await notifyBookingReceived(bookingId);

    console.log("Sending BookingConfirmed...");
    await notifyBookingConfirmed(bookingId);
  }

  if (invoiceId) {
    console.log("Sending InvoiceCreated...");
    await notifyInvoiceCreated(invoiceId);

    console.log("(PaymentReceipt/Failed require paid/failed invoice state — trigger via payment flows)");
  }

  if (galleryId) {
    console.log("Sending GalleryPublished...");
    await notifyGalleryPublished(galleryId);
  }

  console.log("Done. Check Resend dashboard for delivery status.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
