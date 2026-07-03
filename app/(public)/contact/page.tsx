import { ContactForm } from "@/components/contact/contact-form";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact</h1>
          <p className="mt-2 text-muted-foreground">
            Have a project in mind? Send us a message and we&apos;ll get back to you within
            1–2 business days.
          </p>
          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-foreground">Email</dt>
              <dd className="text-muted-foreground">Josiahjoshuah02@gmail.com</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
