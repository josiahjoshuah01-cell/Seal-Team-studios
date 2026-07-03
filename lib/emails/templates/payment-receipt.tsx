import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";
import { portalUrl } from "@/lib/emails/config";

type Props = {
  clientName: string;
  amountLabel: string;
  paymentMethod: string;
  reference?: string | null;
};

export function PaymentReceiptEmail({
  clientName,
  amountLabel,
  paymentMethod,
  reference,
}: Props) {
  return (
    <EmailLayout
      preview={`Payment received: ${amountLabel}`}
      title="Payment receipt"
      ctaLabel="View invoices"
      ctaHref={portalUrl("/portal/invoices")}
    >
      <EmailParagraph>Hi {clientName},</EmailParagraph>
      <EmailParagraph>
        We received your payment of <strong>{amountLabel}</strong> via{" "}
        <strong>{paymentMethod}</strong>. Thank you!
      </EmailParagraph>
      {reference ? (
        <EmailParagraph>
          <strong>Reference:</strong> {reference}
        </EmailParagraph>
      ) : null}
    </EmailLayout>
  );
}
