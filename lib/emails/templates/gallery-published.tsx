import { EmailLayout, EmailParagraph } from "@/lib/emails/templates/email-layout";
import { portalUrl } from "@/lib/emails/config";

type Props = {
  clientName: string;
  galleryTitle: string;
  projectTitle: string;
};

export function GalleryPublishedEmail({
  clientName,
  galleryTitle,
  projectTitle,
}: Props) {
  return (
    <EmailLayout
      preview={`Your gallery "${galleryTitle}" is ready`}
      title="Your gallery is ready"
      ctaLabel="View galleries"
      ctaHref={portalUrl("/portal/galleries")}
    >
      <EmailParagraph>Hi {clientName},</EmailParagraph>
      <EmailParagraph>
        Your gallery <strong>{galleryTitle}</strong> for project{" "}
        <strong>{projectTitle}</strong> is now available in your client portal.
      </EmailParagraph>
      <EmailParagraph>Log in to view, favorite, and download your photos.</EmailParagraph>
    </EmailLayout>
  );
}
