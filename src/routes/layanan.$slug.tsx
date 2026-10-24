import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/site/Layout";
import { rupiah, services } from "@/data/services";
import { site } from "@/config/site";

export const Route = createFileRoute("/layanan/$slug")({
  loader: ({ params }) => {
    const s = services.find((x) => x.slug === params.slug);
    if (!s) throw notFound();
    return { slug: s.slug };
  },
  head: ({ loaderData }) => {
    const s = services.find((x) => x.slug === loaderData?.slug);
    const t = s ? `${s.name} — ${site.brandName}` : "Layanan tidak ditemukan";
    return { meta: [{ title: t }, { name: "description", content: s?.short ?? "" }, { property: "og:title", content: t }, { property: "og:description", content: s?.short ?? "" }] };
  },
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl">Layanan tidak ditemukan</h1>
      <Button asChild className="mt-6"><Link to="/layanan">Kembali ke layanan</Link></Button>
    </div>
  ),
  component: Detail,
});

function Detail() {
  const { slug } = Route.useLoaderData();
  const s = services.find((x) => x.slug === slug)!;
  const [img, setImg] = useState(s.image);
  const related = services.filter((x) => x.slug !== s.slug && x.category === s.category).concat(services.filter((x) => x.slug !== s.slug && x.category !== s.category)).slice(0, 3);

  return (
    <div className="container-page pt-10">
      <Link to="/layanan" className="text-sm text-muted-foreground hover:text-foreground">← Semua layanan</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <img src={img} alt={s.name} width={1024} height={768} className="aspect-[4/3] w-full rounded-3xl object-cover" />
          {s.gallery.length > 1 && (
            <div className="mt-3 flex gap-3">
              {s.gallery.map((g) => (
                <button key={g} onClick={() => setImg(g)} className={`overflow-hidden rounded-xl border-2 ${g === img ? "border-primary" : "border-transparent"}`}>
                  <img src={g} alt="" loading="lazy" className="h-16 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-accent">{s.category}</p>
          <h1 className="mt-2 text-4xl md:text-5xl">{s.name}</h1>
          <p className="mt-4 text-muted-foreground">{s.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{s.duration}</span>
            <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" />Revisi: {s.revisions}</span>
          </div>
          <div className="mt-8 grid gap-3">
            {s.packages.map((p) => (
              <div key={p.name} className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-5">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.features.join(" · ")}</p>
                </div>
                <p className="whitespace-nowrap font-display text-xl">{rupiah(p.price)}</p>
              </div>
            ))}
          </div>
          {s.available ? (
            <Button asChild size="lg" className="mt-6 w-full sm:w-auto"><Link to="/pesan" search={{ layanan: s.slug }}>Pesan layanan ini</Link></Button>
          ) : (
            <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Layanan ini sedang tidak tersedia.</p>
          )}
        </div>
      </div>
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {[["Manfaat", s.benefits], ["Yang Anda terima", s.deliverables], ["Yang perlu disiapkan", s.requirements]].map(([t, items]) => (
          <div key={t as string}>
            <h2 className="text-2xl">{t as string}</h2>
            <ul className="mt-4 space-y-2">
              {(items as string[]).map((i) => <li key={i} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <h2 className="mt-20 text-3xl">Layanan terkait</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ServiceCard key={r.slug} s={r} />)}</div>
    </div>
  );
}
