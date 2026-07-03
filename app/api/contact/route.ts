import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { logError } from "@/lib/logger";
import { notifyContactFormReceived } from "@/lib/emails/notify";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: parsed.error.issues[0]?.message ?? "Invalid input",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    void notifyContactFormReceived(parsed.data);

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError("contact_form", err);
    return NextResponse.json(
      { error: { message: "Failed to submit contact form", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
