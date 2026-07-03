import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";
import { portalUrl } from "@/lib/emails/config";

type Props = {
  clientName: string;
  serviceName: string;
  slotLabel: string;
};

export function BookingConfirmedEmail({
  clientName,
  serviceName,
  slotLabel,
}: Props) {
  return (
    <EmailLayout
      preview="Your booking is confirmed"
      title="Booking confirmed"
      ctaLabel="View client portal"
      ctaHref={portalUrl("/portal/dashboard")}
    >
      <EmailParagraph>Hi {clientName},</EmailParagraph>
      <EmailParagraph>
        Great news — your <strong>{serviceName}</strong> booking is confirmed for{" "}
        <strong>{slotLabel}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        We&apos;re looking forward to working with you. Check your portal for invoices,
        galleries, and project updates.
      </EmailParagraph>
    </EmailLayout>
  );
}
