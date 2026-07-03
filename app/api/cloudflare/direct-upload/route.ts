import { NextResponse } from "next/server";
import { z } from "zod";
import { createDirectUploadUrl } from "@/lib/cloudflare/stream";
import { isCloudflareStreamConfigured } from "@/lib/cloudflare/config";
import { requireAdmin } from "@/lib/admin/auth";
import { logError } from "@/lib/logger";

const bodySchema = z.object({
  fileSizeBytes: z.number().int().positive(),
  maxDurationSeconds: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    if (!isCloudflareStreamConfigured()) {
      return NextResponse.json(
        { error: "Cloudflare Stream is not configured" },
        { status: 503 }
      );
    }

    const body = bodySchema.parse(await request.json());
    const result = await createDirectUploadUrl({
      fileSizeBytes: body.fileSizeBytes,
      maxDurationSeconds: body.maxDurationSeconds,
    });

    return NextResponse.json(result);
  } catch (err) {
    await logError("cloudflare_direct_upload", err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Unable to start video upload",
      },
      { status: 500 }
    );
  }
}
