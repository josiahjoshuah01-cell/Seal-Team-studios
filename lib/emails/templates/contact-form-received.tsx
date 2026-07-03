import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";

type Props = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
};

export function ContactFormReceivedEmail({
  name,
  email,
  phone,
  message,
}: Props) {
  return (
    <EmailLayout preview={`Contact form from ${name}`} title="New contact message">
      <EmailParagraph>
        <strong>Name:</strong> {name}
      </EmailParagraph>
      <EmailParagraph>
        <strong>Email:</strong> {email}
      </EmailParagraph>
      {phone ? (
        <EmailParagraph>
          <strong>Phone:</strong> {phone}
        </EmailParagraph>
      ) : null}
      <EmailParagraph>
        <strong>Message:</strong>
      </EmailParagraph>
      <EmailParagraph>{message}</EmailParagraph>
    </EmailLayout>
  );
}
