import { getActiveServices } from "@/lib/data/services";
import { ServiceCard } from "@/components/services/service-card";

export const metadata = { title: "Services & Pricing" };

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Services &amp; Pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Professional photography and video packages tailored to your needs.
        </p>
      </div>

      {services.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No services available yet. Check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
