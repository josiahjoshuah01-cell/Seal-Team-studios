/**
 * Email-specific env helpers — read directly from process.env so email delivery
 * is not blocked by unrelated required env validation elsewhere.
 */

/** Verified domain required in Resend for production delivery outside the sandbox. */
export function getEmailFrom() {
  return process.env.EMAIL_FROM ?? "SealTeam Studio <onboarding@resend.dev>";
}

export function getAdminNotificationEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? null;
}

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function portalUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
