import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ServiceCard } from "../components/site/Layout";
import { categories as baseCategories, startingPrice } from "../data/services";
import { listPublicServices } from "@/lib/catalog.functions";
import { toService } from "@/lib/catalog";
import { site } from "../config/site";

export const Route = createFileRoute("/layanan/")({
  loader: async () => {
    const rows = await listPublicServices();
    return { services: rows.map(toService) };
  },
  head: () => ({
    meta: [
      { title: `Layanan & Harga — ${site.brandName}` },
      { name: "description", content: `Daftar lengkap layanan ${site.brandName}: desain poster, editing video, perapian dokumen, hingga administrasi keuangan sederhana.` },
      { property: "og:title", content: `Layanan & Harga — ${site.brandName}` },
      { property: "og:description", content: `Daftar lengkap layanan ${site.brandName} dengan estimasi harga dan durasi pengerjaan.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LayananList,
});

function LayananList() {
  const { services } = Route.useLoaderData();
  const categories = useMemo(
    () => Array.from(new Set<string>([...baseCategories, ...services.map((s) => s.category)])),
    [services],
  );
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"relevan" | "murah" | "mahal">("relevan");

  const list = useMemo(() => {
    let l = services.filter((s) => (!cat || s.category === cat) && (!q || `${s.name} ${s.short}`.toLowerCase().includes(q.toLowerCase())));
    if (sort === "murah") l = [...l].sort((a, b) => startingPrice(a) - startingPrice(b));
    if (sort === "mahal") l = [...l].sort((a, b) => startingPrice(b) - startingPrice(a));
    return l;
  }, [services, cat, q, sort]);

  return (
    <div className="container-page py-14">
      <h1 className="text-center">Semua Layanan</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">Harga mulai dari, final disepakati setelah diskusi kebutuhan di WhatsApp.</p>

      <div className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari layanan..." className="w-full bg-transparent text-sm outline-none" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => setCat(null)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${!cat ? "bg-primary text-primary-foreground" : "bg-secondary text-primary hover:bg-accent/40"}`}>Semua</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(cat === c ? null : c)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-primary hover:bg-accent/40"}`}>{c}</button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-primary">
          <option value="relevan">Urutan bawaan</option>
          <option value="murah">Harga terendah</option>
          <option value="mahal">Harga tertinggi</option>
        </select>
      </div>

      {list.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => <ServiceCard key={s.slug} s={s} />)}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-muted-foreground">Tidak ada layanan yang cocok. Coba kata kunci lain.</p>
      )}
    </div>
  );
}
