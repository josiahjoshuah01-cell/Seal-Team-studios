"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteButton({
  label,
  onDelete,
  redirectTo,
}: {
  label: string;
  onDelete: () => Promise<{ success: boolean; error?: string }>;
  redirectTo: string;
}) {
  const router = useRouter();

  async function handleClick() {
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;

    const result = await onDelete();
    if (!result.success) {
      toast.error(result.error ?? "Delete failed");
      return;
    }

    toast.success(`${label} deleted`);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-destructive hover:underline"
    >
      Delete {label.toLowerCase()}
    </button>
  );
}
