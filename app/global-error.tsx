"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center px-4">
          <h2 className="text-xl font-semibold">Application error</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || "Something went wrong"}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-accent px-4 py-2 text-sm text-accent-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
