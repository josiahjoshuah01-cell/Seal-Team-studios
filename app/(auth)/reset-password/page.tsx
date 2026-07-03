import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground">Choose a strong password</p>
        </div>
        <ResetPasswordForm />
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
