import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, RefreshCcw, ClipboardList, ArrowLeft } from "lucide-react";
import { listPublicServices } from "@/lib/catalog.functions";
import { toService } from "@/lib/catalog";
import { rupiah } from "../data/services";
import { site, waLink } from "../config/site";

export const Route = createFileRoute("/layanan/$slug")({
  loader: async ({ params }) => {
    const rows = await listPublicServices();
    const all = rows.map(toService);
    const s = all.find((x) => x.slug === params.slug);
    if (!s) throw notFound();
    return { s, related: all.filter((x) => x.slug !== s.slug && x.category === s.category).slice(0, 3) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.s.name} — ${site.brandName}` },
          { name: "description", content: loaderData.s.short },
          { property: "og:title", content: `${loaderData.s.name} — ${site.brandName}` },
          { property: "og:description", content: loaderData.s.short },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [],
  }),
  component: LayananDetail,
});

function LayananDetail() {
  const { s, related } = Route.useLoaderData();
  const [img, setImg] = useState(0);

  return (
    <div className="container-page py-12">
      <Link to="/layanan" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Semua layanan</Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <img src={s.gallery[img]} alt={s.name} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" />
          {s.gallery.length > 1 && (
            <div className="mt-3 flex gap-3">
              {s.gallery.map((g, i) => (
                <button key={i} onClick={() => setImg(i)} className={`overflow-hidden rounded-xl border-2 ${i === img ? "border-primary" : "border-transparent"}`}>
                  <img src={g} alt="" className="h-16 w-24 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{s.category}</span>
          <h1 className="mt-4 text-4xl md:text-5xl">{s.name}</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{s.description}</p>

          {s.benefits.length > 0 && (
            <ul className="mt-6 space-y-2">
              {s.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> {b}</li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border bg-card p-4"><Clock className="h-4 w-4 text-accent" /><p className="mt-2 font-semibold">{s.duration}</p><p className="text-xs text-muted-foreground">Estimasi pengerjaan</p></div>
            <div className="rounded-xl border bg-card p-4"><RefreshCcw className="h-4 w-4 text-accent" /><p className="mt-2 font-semibold">{s.revisions}</p><p className="text-xs text-muted-foreground">Revisi</p></div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/pesan" search={{ layanan: s.slug }} className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Pesan Layanan Ini
            </Link>
            <a href={waLink(`Halo ${site.brandName}, saya ingin bertanya tentang layanan ${s.name}.`)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border border-primary px-7 text-sm font-semibold text-primary hover:bg-secondary">
              Tanya dulu
            </a>
          </div>
        </div>
      </div>

      {/* PAKET */}
      {s.packages.length > 0 && (
        <section className="mt-16">
          <h2 className="text-center">Pilihan Paket</h2>
          <div className={`mt-8 grid gap-5 ${s.packages.length >= 3 ? "md:grid-cols-3" : s.packages.length === 2 ? "mx-auto max-w-3xl md:grid-cols-2" : "mx-auto max-w-md"}`}>
            {s.packages.map((p, i) => (
              <div key={p.name} className={`rounded-2xl border bg-card p-6 ${i === 1 && s.packages.length > 2 ? "ring-2 ring-primary shadow-soft" : ""}`}>
                <h3 className="text-xl">{p.name}</h3>
                <p className="mt-2 font-display text-3xl text-primary">{rupiah(p.price)}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}
                </ul>
                <Link to="/pesan" search={{ layanan: s.slug }} className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary transition-colors hover:bg-accent/40">
                  Pilih paket ini
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DELIVERABLES & SYARAT */}
      {(s.deliverables.length > 0 || s.requirements.length > 0) && (
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          {s.deliverables.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="text-xl">Yang Anda terima</h3>
              <ul className="mt-4 space-y-2 text-sm">{s.deliverables.map((d) => <li key={d} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{d}</li>)}</ul>
            </div>
          )}
          {s.requirements.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="text-xl flex items-center gap-2"><ClipboardList className="h-5 w-5 text-accent" /> Yang perlu Anda siapkan</h3>
              <ul className="mt-4 space-y-2 text-sm">{s.requirements.map((r) => <li key={r} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{r}</li>)}</ul>
            </div>
          )}
        </section>
      )}

      {/* TERKAIT */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2>Layanan terkait</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} to="/layanan/$slug" params={{ slug: r.slug }} className="rounded-2xl border bg-card p-5 transition-transform hover:-translate-y-1">
                <p className="font-semibold">{r.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.short}</p>
                <p className="mt-2 text-sm font-bold text-primary">mulai {rupiah(Math.min(...r.packages.map((p) => p.price)))}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
