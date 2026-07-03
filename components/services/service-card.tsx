import { formatCurrency, formatDuration } from "@/lib/utils/format";
import type { Service } from "@/lib/data/services";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">{service.name}</h3>
      {service.description && (
        <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
          {service.description}
        </p>
      )}
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-4">
        {service.price != null && (
          <p className="text-xl font-semibold text-foreground">
            {formatCurrency(Number(service.price))}
          </p>
        )}
        {service.duration_minutes != null && (
          <p className="text-sm text-muted-foreground">
            {formatDuration(service.duration_minutes)}
          </p>
        )}
      </div>
    </div>
  );
}
