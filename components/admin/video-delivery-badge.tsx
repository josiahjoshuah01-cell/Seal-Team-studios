type Method = "cloudflare" | "whatsapp" | "not_applicable";
type Status = "not_sent" | "sent" | "not_applicable";

const methodLabels: Record<Method, string> = {
  cloudflare: "Cloudflare",
  whatsapp: "WhatsApp",
  not_applicable: "—",
};

export function VideoDeliveryCell({
  method,
  status,
}: {
  method: Method | null;
  status: Status | null;
}) {
  const m = method ?? "not_applicable";
  const s = status ?? "not_applicable";

  if (m === "not_applicable") {
    return <span className="text-muted-foreground">—</span>;
  }

  if (m === "cloudflare") {
    return (
      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        Gallery
      </span>
    );
  }

  const statusStyles =
    s === "sent"
      ? "bg-accent/15 text-accent-foreground"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-400";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{methodLabels[m]}</span>
      <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs ${statusStyles}`}>
        {s === "sent" ? "Sent" : "Not sent"}
      </span>
    </div>
  );
}
