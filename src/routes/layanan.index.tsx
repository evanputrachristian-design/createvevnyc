import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, ServiceCard } from "@/components/site/Layout";
import { categories, services, startingPrice } from "@/data/services";
import { site } from "@/config/site";

export const Route = createFileRoute("/layanan/")({
  validateSearch: (s: Record<string, unknown>) => ({ kategori: typeof s.kategori === "string" ? s.kategori : undefined }),
  head: () => ({
    meta: [
      { title: `Layanan — ${site.brandName}` },
      { name: "description", content: "Daftar jasa desain, video, dokumen, dan administrasi keuangan." },
      { property: "og:title", content: `Layanan — ${site.brandName}` },
      { property: "og:description", content: "Daftar jasa desain, video, dokumen, dan administrasi keuangan." },
    ],
  }),
  component: Layanan,
});

function Layanan() {
  const { kategori } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("default");
  const list = useMemo(() => {
    let r = services.filter((s) => (!kategori || s.category === kategori) && (s.name + s.short).toLowerCase().includes(q.toLowerCase()));
    if (sort === "price-asc") r = [...r].sort((a, b) => startingPrice(a) - startingPrice(b));
    if (sort === "price-desc") r = [...r].sort((a, b) => startingPrice(b) - startingPrice(a));
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [kategori, q, sort]);

  const chip = (active: boolean) => `rounded-full border px-4 py-1.5 text-sm transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`;

  return (
    <>
      <PageHeader eyebrow="Layanan" title="Pilih jasa yang Anda butuhkan">Semua layanan dapat dipesan online. Harga final dikonfirmasi admin.</PageHeader>
      <div className="container-page">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari layanan..." className="h-11 rounded-full bg-card pl-9" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 rounded-full border bg-card px-4 text-sm" aria-label="Urutkan">
            <option value="default">Urutan default</option>
            <option value="price-asc">Harga terendah</option>
            <option value="price-desc">Harga tertinggi</option>
            <option value="name">Nama A–Z</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={chip(!kategori)} onClick={() => navigate({ search: { kategori: undefined } })}>Semua</button>
          {categories.map((c) => (
            <button key={c} className={chip(kategori === c)} onClick={() => navigate({ search: { kategori: c } })}>{c}</button>
          ))}
        </div>
        {list.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((s) => <ServiceCard key={s.slug} s={s} />)}</div>
        ) : (
          <p className="mt-16 text-center text-muted-foreground">Tidak ada layanan yang cocok.</p>
        )}
      </div>
    </>
  );
}
