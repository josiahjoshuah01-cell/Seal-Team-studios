import { getPortalInvoices } from "@/lib/portal/invoices";
import { getPortalClientPhone } from "@/lib/portal/client";
import { getPayPalClientId, isPayPalConfigured } from "@/lib/paypal/config";
import { isMpesaConfigured } from "@/lib/mpesa/config";
import { PortalInvoicesList } from "@/components/portal/portal-invoices-list";

export const metadata = { title: "Invoices" };

export default async function PortalInvoicesPage() {
  const [invoices, defaultPhone] = await Promise.all([
    getPortalInvoices(),
    getPortalClientPhone(),
  ]);

  const paypalEnabled = isPayPalConfigured();
  const mpesaEnabled = isMpesaConfigured();
  const paypalClientId = paypalEnabled ? getPayPalClientId() : "";

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
      <p className="mt-2 text-muted-foreground">
        View and pay outstanding invoices for your projects.
      </p>

      <PortalInvoicesList
        invoices={invoices}
        paypalClientId={paypalClientId}
        paypalEnabled={paypalEnabled}
        mpesaEnabled={mpesaEnabled}
        defaultPhone={defaultPhone}
      />
    </div>
  );
}
