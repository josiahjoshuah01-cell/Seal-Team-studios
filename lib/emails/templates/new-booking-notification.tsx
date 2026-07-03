import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";
import { portalUrl } from "@/lib/emails/config";

type Props = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  slotLabel: string;
  notes?: string | null;
};

export function NewBookingNotificationEmail({
  clientName,
  clientEmail,
  serviceName,
  slotLabel,
  notes,
}: Props) {
  return (
    <EmailLayout
      preview={`New booking request from ${clientName}`}
      title="New booking request"
      ctaLabel="Review in admin"
      ctaHref={portalUrl("/admin/bookings")}
    >
      <EmailParagraph>A new booking request was submitted.</EmailParagraph>
      <EmailParagraph>
        <strong>Client:</strong> {clientName} ({clientEmail})
      </EmailParagraph>
      <EmailParagraph>
        <strong>Service:</strong> {serviceName}
      </EmailParagraph>
      <EmailParagraph>
        <strong>Requested slot:</strong> {slotLabel}
      </EmailParagraph>
      {notes ? (
        <EmailParagraph>
          <strong>Notes:</strong> {notes}
        </EmailParagraph>
      ) : null}
    </EmailLayout>
  );
}
