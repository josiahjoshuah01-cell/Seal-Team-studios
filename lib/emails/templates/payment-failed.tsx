import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";
import { portalUrl } from "@/lib/emails/config";

type Props = {
  clientName: string;
  amountLabel: string;
  reason?: string | null;
};

export function PaymentFailedEmail({
  clientName,
  amountLabel,
  reason,
}: Props) {
  return (
    <EmailLayout
      preview="Your M-Pesa payment could not be completed"
      title="Payment not completed"
      ctaLabel="Try again"
      ctaHref={portalUrl("/portal/invoices")}
    >
      <EmailParagraph>Hi {clientName},</EmailParagraph>
      <EmailParagraph>
        Your M-Pesa payment for <strong>{amountLabel}</strong> was not completed.
      </EmailParagraph>
      {reason ? (
        <EmailParagraph>
          <strong>Reason:</strong> {reason}
        </EmailParagraph>
      ) : null}
      <EmailParagraph>
        You can try again from your client portal, or contact us if you need help.
      </EmailParagraph>
    </EmailLayout>
  );
}
