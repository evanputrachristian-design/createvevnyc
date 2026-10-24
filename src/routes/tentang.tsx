import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/Layout";
import { site } from "@/config/site";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: `Tentang Kami — ${site.brandName}` },
      { name: "description", content: site.about.vision },
      { property: "og:title", content: `Tentang Kami — ${site.brandName}` },
      { property: "og:description", content: site.about.vision },
    ],
  }),
  component: About,
});

function About() {
  const a = site.about;
  return (
    <>
      <PageHeader eyebrow="Tentang kami" title={`Mengenal ${site.brandName}`}>{site.description}</PageHeader>
      <div className="container-page grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl">Cerita kami</h2>
          <p className="mt-3 text-muted-foreground">{a.story}</p>
          <h2 className="mt-10 text-2xl">Visi</h2>
          <p className="mt-3 text-muted-foreground">{a.vision}</p>
          <h2 className="mt-10 text-2xl">Misi</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{a.mission.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
        <div className="space-y-4">
          {a.values.map((v) => (
            <div key={v.title} className="rounded-2xl border bg-card p-6">
              <p className="font-display text-2xl">{v.title}</p>
              <p className="mt-1 text-muted-foreground">{v.text}</p>
            </div>
          ))}
          <div className="rounded-2xl bg-secondary p-6">
            <p className="font-semibold">Hubungi kami</p>
            <p className="mt-1 text-sm text-muted-foreground">{site.email} · {site.serviceArea}</p>
            <Button asChild className="mt-4"><Link to="/kontak">Halaman kontak</Link></Button>
          </div>
        </div>
      </div>
    </>
  );
}
