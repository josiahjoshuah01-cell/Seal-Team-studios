import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";
import { portalUrl } from "@/lib/emails/config";

type Props = {
  clientName: string;
  serviceName: string;
  slotLabel: string;
};

export function BookingReceivedEmail({
  clientName,
  serviceName,
  slotLabel,
}: Props) {
  return (
    <EmailLayout
      preview="We received your booking request"
      title="Booking request received"
      ctaLabel="View client portal"
      ctaHref={portalUrl("/portal/dashboard")}
    >
      <EmailParagraph>Hi {clientName},</EmailParagraph>
      <EmailParagraph>
        Thanks for your booking request. We&apos;ve received your request for a{" "}
        <strong>{serviceName}</strong> session on <strong>{slotLabel}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        We&apos;ll review availability and confirm your booking within 1–2 business
        days. You&apos;ll receive another email once it&apos;s confirmed.
      </EmailParagraph>
    </EmailLayout>
  );
}
