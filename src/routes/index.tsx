import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Film, FileText, ArrowRight, Clock, Wallet, ShieldCheck } from "lucide-react";
import { ServiceCard } from "../components/site/Layout";
import { site, waLink } from "../config/site";
import { categories } from "../data/services";
import { listPublicServices } from "@/lib/catalog.functions";
import { toService } from "@/lib/catalog";
import hero from "../assets/hero.jpg";

const catIcons = [Sparkles, Sparkles, Film, Film, FileText, FileText];
const steps = [
  { n: 1, t: "Pilih jasa & isi formulir", d: "Jelaskan kebutuhan Anda pada formulir pemesanan yang singkat." },
  { n: 2, t: "Diskusi via WhatsApp", d: "Kami balas untuk menyepakati detail, waktu, dan biaya akhir." },
  { n: 3, t: "Dikerjakan & direvisi", d: "Pekerjaan dimulai setelah pembayaran awal; revisi sesuai paket." },
  { n: 4, t: "File dikirim", d: "Hasil akhir dikirim dalam format digital yang Anda butuhkan." },
];
const trust = [
  { icon: Clock, t: "Tepat waktu", d: "Tenggat yang disepakati selalu kami jaga." },
  { icon: Wallet, t: "Harga jelas", d: "Biaya disepakati di awal, tanpa biaya tersembunyi." },
  { icon: ShieldCheck, t: "Komunikasi mudah", d: "Cukup lewat WhatsApp dari awal sampai akhir." },
];

export const Route = createFileRoute("/")({
  loader: async () => {
    const rows = await listPublicServices();
    return { services: rows.map(toService) };
  },
  head: () => ({
    meta: [
      { title: `${site.brandName} — ${site.tagline}` },
      { name: "description", content: site.description },
      { property: "og:title", content: `${site.brandName} — ${site.tagline}` },
      { property: "og:description", content: site.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { services } = Route.useLoaderData();
  const featured = services.filter((s) => s.featured && s.available);
  return (
    <>
      {/* HERO */}
      <section className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            {site.serviceArea}
          </span>
          <h1 className="mt-5">{site.tagline}</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">{site.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/pesan" className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90">
              Pesan Sekarang
            </Link>
            <Link to="/layanan" className="inline-flex h-12 items-center rounded-full border border-primary px-7 text-sm font-semibold text-primary transition-colors hover:bg-secondary">
              Lihat Layanan <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative">
          <img src={hero} alt="Ilustrasi layanan kreatif dan administrasi" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" />
          <div className="absolute -bottom-5 left-5 rounded-2xl border bg-card px-5 py-4 shadow-soft">
            <p className="font-display text-2xl text-primary">100% digital</p>
            <p className="text-xs text-muted-foreground">Pesan dari mana saja, hasil dikirim online</p>
          </div>
        </div>
      </section>

      {/* KATEGORI */}
      <section className="bg-secondary/60 py-16">
        <div className="container-page">
          <h2 className="text-center">Bidang yang kami bantu</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((c, i) => {
              const Icon = catIcons[i] ?? Sparkles;
              return (
                <Link key={c} to="/layanan" className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center transition-transform hover:-translate-y-1">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/20 text-primary transition-colors group-hover:bg-accent/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold">{c}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* LAYANAN PILIHAN */}
      {featured.length > 0 && (
        <section className="container-page py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Layanan Pilihan</p>
              <h2 className="mt-2">Paling sering dipesan</h2>
            </div>
            <Link to="/layanan" className="hidden items-center gap-1 text-sm font-semibold text-primary md:inline-flex">
              Semua layanan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((s) => <ServiceCard key={s.slug} s={s} />)}
          </div>
        </section>
      )}

      {/* CARA PESAN */}
      <section className="container-page py-16">
        <h2 className="text-center">Cara memesan</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">Empat langkah sederhana dari pesan sampai file diterima.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map((st) => (
            <div key={st.n} className="relative rounded-2xl border bg-card p-6">
              <span className="font-display text-5xl text-accent/50">{st.n}</span>
              <h3 className="mt-3 text-lg">{st.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{st.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KEUNGGULAN */}
      <section className="bg-ink py-16 text-ink-foreground">
        <div className="container-page grid gap-8 md:grid-cols-3">
          {trust.map((t) => (
            <div key={t.t} className="flex gap-4">
              <t.icon className="h-8 w-8 shrink-0 text-accent" />
              <div>
                <h3 className="text-xl">{t.t}</h3>
                <p className="mt-2 text-sm opacity-75">{t.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground shadow-soft md:py-16">
          <h2 className="text-primary-foreground">Siap mulai pesanan Anda?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-80">Isi formulir singkat, kami balas di WhatsApp untuk menyepakati detailnya.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/pesan" className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90">Isi Formulir Pesanan</Link>
            <a href={waLink(`Halo ${site.brandName}, saya ingin bertanya tentang layanan Anda.`)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border border-primary-foreground/40 px-7 text-sm font-semibold transition-colors hover:bg-primary-foreground/10">
              Chat WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
