import { NextResponse } from "next/server";
import { z } from "zod";
import { getVideoStatus } from "@/lib/cloudflare/stream";
import { isCloudflareStreamConfigured } from "@/lib/cloudflare/config";
import { requireAdmin } from "@/lib/admin/auth";
import { logError } from "@/lib/logger";

const querySchema = z.object({
  uid: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();

    if (!isCloudflareStreamConfigured()) {
      return NextResponse.json(
        { error: "Cloudflare Stream is not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({ uid: searchParams.get("uid") });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
    }

    const status = await getVideoStatus(parsed.data.uid);
    return NextResponse.json(status);
  } catch (err) {
    await logError("cloudflare_video_status", err);
    return NextResponse.json(
      { error: "Unable to check video status" },
      { status: 500 }
    );
  }
}
