import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/site/Layout";
import { categories } from "@/data/services";
import { portfolio, type PortfolioItem } from "@/data/portfolio";
import { site } from "@/config/site";

export const Route = createFileRoute("/portofolio")({
  head: () => ({
    meta: [
      { title: `Portofolio — ${site.brandName}` },
      { name: "description", content: "Contoh hasil kerja desain, video, dokumen, dan administrasi." },
      { property: "og:title", content: `Portofolio — ${site.brandName}` },
      { property: "og:description", content: "Contoh hasil kerja desain, video, dokumen, dan administrasi." },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState<PortfolioItem | null>(null);
  const list = portfolio.filter((p) => !cat || p.category === cat);
  const chip = (a: boolean) => `rounded-full border px-4 py-1.5 text-sm ${a ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`;
  return (
    <>
      <PageHeader eyebrow="Portofolio" title="Contoh hasil pekerjaan" />
      <div className="container-page">
        <div className="flex flex-wrap gap-2">
          <button className={chip(!cat)} onClick={() => setCat(null)}>Semua</button>
          {categories.map((c) => <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <button key={p.id} onClick={() => setOpen(p)} className="group text-left">
              <div className="overflow-hidden rounded-2xl">
                <img src={p.image} alt={p.title} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <p className="mt-3 font-semibold">{p.title}</p>
              <p className="text-sm text-muted-foreground">{p.category}</p>
            </button>
          ))}
        </div>
        {!list.length && <p className="mt-16 text-center text-muted-foreground">Belum ada karya di kategori ini.</p>}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <img src={open.image} alt={open.title} className="aspect-[4/3] w-full rounded-xl object-cover" />
              <DialogTitle className="font-display text-2xl">{open.title}</DialogTitle>
              <DialogDescription>{open.category}{open.date ? ` · ${open.date}` : ""} — {open.description}</DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
