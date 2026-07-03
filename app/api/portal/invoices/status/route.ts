import { NextResponse } from "next/server";
import { z } from "zod";
import { getPortalInvoiceStatus } from "@/lib/portal/invoices";

const querySchema = z.object({
  invoice_id: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    invoice_id: searchParams.get("invoice_id"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  }

  const status = await getPortalInvoiceStatus(parsed.data.invoice_id);

  if (!status) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ status: status.status });
}
