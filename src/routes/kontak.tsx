import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Mail, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/Layout";
import { site, waLink } from "@/config/site";

export const Route = createFileRoute("/kontak")({
  head: () => ({
    meta: [
      { title: `Kontak — ${site.brandName}` },
      { name: "description", content: `Hubungi ${site.brandName} melalui WhatsApp, email, atau media sosial.` },
      { property: "og:title", content: `Kontak — ${site.brandName}` },
      { property: "og:description", content: `Hubungi ${site.brandName} melalui WhatsApp, email, atau media sosial.` },
    ],
  }),
  component: Contact,
});

function Contact() {
  const c = site.contactDisplay;
  return (
    <>
      <PageHeader eyebrow="Kontak" title="Mari bicara tentang kebutuhan Anda">{site.serviceArea}</PageHeader>
      <div className="container-page grid gap-6 md:grid-cols-2">
        {c.showWhatsapp && (
          <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
            <MessageCircle className="h-7 w-7" />
            <h2 className="mt-4 text-2xl">WhatsApp</h2>
            <p className="mt-1 opacity-80">Cara tercepat untuk bertanya dan memesan.</p>
            <Button asChild variant="inverse" className="mt-6"><a href={waLink(`Halo ${site.brandName}, saya ingin bertanya.`)} target="_blank" rel="noreferrer">Chat WhatsApp</a></Button>
          </div>
        )}
        <div className="space-y-4">
          {c.showEmail && (
            <a href={`mailto:${site.email}`} className="flex items-center gap-4 rounded-2xl border bg-card p-6 hover:border-primary">
              <Mail className="h-5 w-5 text-accent" /><div><p className="font-semibold">Email</p><p className="text-sm text-muted-foreground">{site.email}</p></div>
            </a>
          )}
          {c.showSocials && (
            <div className="flex items-start gap-4 rounded-2xl border bg-card p-6">
              <Globe className="h-5 w-5 text-accent" />
              <div><p className="font-semibold">Media sosial</p>
                <div className="mt-1 flex flex-wrap gap-3 text-sm">{site.socials.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">{s.label}</a>)}</div>
              </div>
            </div>
          )}
          {c.showHours && (
            <div className="flex items-start gap-4 rounded-2xl border bg-card p-6">
              <Clock className="h-5 w-5 text-accent" />
              <div className="flex-1"><p className="font-semibold">Jam operasional</p>
                {site.operatingHours.map((h) => <p key={h.day} className="mt-1 flex justify-between text-sm text-muted-foreground"><span>{h.day}</span><span>{h.hours}</span></p>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
