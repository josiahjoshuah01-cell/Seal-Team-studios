import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

type Props = {
  preview: string;
  title: string;
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
};

export function EmailLayout({
  preview,
  title,
  children,
  ctaLabel,
  ctaHref,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>SealTeam Studio</Text>
          <Heading style={heading}>{title}</Heading>
          <Section style={content}>{children}</Section>
          {ctaLabel && ctaHref ? (
            <Section style={ctaSection}>
              <Button href={ctaHref} style={button}>
                {ctaLabel}
              </Button>
            </Section>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>
            Photography &amp; Video · SealTeam Studio
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const brand = {
  color: "#111111",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 24px",
};

const heading = {
  color: "#111111",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const content = {
  color: "#444444",
  fontSize: "15px",
  lineHeight: "24px",
};

const ctaSection = {
  marginTop: "24px",
};

const button = {
  backgroundColor: "#111111",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 20px",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "32px 0 16px",
};

const footer = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "20px",
};

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <Text style={{ margin: "0 0 12px", color: "#444444" }}>{children}</Text>;
}
