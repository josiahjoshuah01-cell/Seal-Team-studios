import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";
import { portalUrl } from "@/lib/emails/config";

type Props = {
  clientName: string;
  amountLabel: string;
  description?: string | null;
  projectTitle?: string | null;
};

export function InvoiceCreatedEmail({
  clientName,
  amountLabel,
  description,
  projectTitle,
}: Props) {
  return (
    <EmailLayout
      preview={`New invoice: ${amountLabel}`}
      title="New invoice"
      ctaLabel="Pay invoice"
      ctaHref={portalUrl("/portal/invoices")}
    >
      <EmailParagraph>Hi {clientName},</EmailParagraph>
      <EmailParagraph>
        A new invoice for <strong>{amountLabel}</strong> has been issued
        {projectTitle ? (
          <>
            {" "}
            for project <strong>{projectTitle}</strong>
          </>
        ) : null}
        .
      </EmailParagraph>
      {description ? (
        <EmailParagraph>
          <strong>Description:</strong> {description}
        </EmailParagraph>
      ) : null}
      <EmailParagraph>
        You can pay online via PayPal or M-Pesa from your client portal.
      </EmailParagraph>
    </EmailLayout>
  );
}
