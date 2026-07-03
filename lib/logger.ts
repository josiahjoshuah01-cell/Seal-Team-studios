import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

function serializeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export async function logError(
  source: string,
  error: unknown,
  metadata?: Record<string, unknown>
) {
  const { message, stack } = serializeError(error);

  if (process.env.NODE_ENV === "development") {
    console.error(`[${source}]`, message, metadata ?? "", stack ?? "");
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("error_logs").insert({
      source,
      message,
      stack: stack ?? null,
      metadata: (metadata as Json) ?? null,
    });
  } catch (logFailure) {
    console.error("[logger] Failed to write error_logs:", logFailure);
  }
}
