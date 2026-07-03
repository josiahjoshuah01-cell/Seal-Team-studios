import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Error logs" };

export default async function AdminErrorLogsPage() {
  let logs: {
    id: string;
    source: string | null;
    message: string | null;
    created_at: string;
  }[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("error_logs")
      .select("id, source, message, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    logs = data ?? [];
  } catch {
    logs = [];
  }

  return (
    <div>
      <AdminPageHeader title="Error logs" description="Production debugging — last 100 entries." />

      {logs.length === 0 ? (
        <p className="text-muted-foreground">No error logs yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.source ?? "—"}</td>
                  <td className="max-w-md truncate px-4 py-3 text-muted-foreground">
                    {log.message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
