import { createFileRoute, Link } from "@tanstack/react-router";
import { Palette, Film, FileText, Calculator, Clapperboard, Image, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ServiceCard } from "@/components/site/Layout";
import { site } from "@/config/site";
import { categories, services } from "@/data/services";
import { faqs, portfolio } from "@/data/portfolio";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${site.brandName} — Jasa Kreatif & Administrasi Digital` },
      { name: "description", content: site.description },
      { property: "og:title", content: `${site.brandName} — Jasa Kreatif & Administrasi Digital` },
      { property: "og:description", content: site.description },
    ],
  }),
  component: Index,
});

const icons = [Image, Palette, Film, Clapperboard, FileText, Calculator];
const steps = [
  ["Pilih layanan", "Lihat detail, paket, dan persyaratan."],
  ["Isi formulir", "Jelaskan kebutuhan dan tenggat Anda."],
  ["Konfirmasi via WhatsApp", "Admin mengecek detail dan harga akhir."],
  ["Terima hasil", "File dikirim, revisi sesuai paket."],
];
const perks = ["Harga dan revisi dijelaskan di awal", "Komunikasi langsung dengan pengerja", "Format file siap pakai", "Data dan file Anda dijaga kerahasiaannya"];

function Index() {
  return (
    <>
      <section className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div className="fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Jasa kreatif & administrasi</p>
          <h1 className="mt-4 text-5xl leading-[1.05] md:text-7xl">Urusan desain & dokumen, beres dengan rapi.</h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">{site.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/pesan">Mulai pesan</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/layanan">Lihat layanan</Link></Button>
          </div>
        </div>
        <img src={hero} alt="Meja kerja desain" width={1280} height={960} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" />
      </section>

      <section className="container-page py-12">
        <h2 className="text-3xl md:text-4xl">Kategori layanan</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => {
            const Icon = icons[i];
            return (
              <Link key={c} to="/layanan" search={{ kategori: c }} className="rounded-2xl border bg-card p-5 transition-colors hover:border-primary">
                <Icon className="h-6 w-6 text-accent" />
                <p className="mt-4 text-sm font-semibold">{c}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl">Layanan pilihan</h2>
          <Link to="/layanan" className="text-sm font-semibold text-primary">Semua layanan →</Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.filter((s) => s.featured).map((s) => <ServiceCard key={s.slug} s={s} />)}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl">Portofolio</h2>
          <Link to="/portofolio" className="text-sm font-semibold text-primary">Lihat semua →</Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {portfolio.slice(0, 3).map((p) => (
            <figure key={p.id}>
              <img src={p.image} alt={p.title} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full rounded-2xl object-cover" />
              <figcaption className="mt-3 text-sm"><span className="font-semibold">{p.title}</span> · <span className="text-muted-foreground">{p.category}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-12 bg-ink py-20 text-ink-foreground">
        <div className="container-page grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl md:text-4xl">Alur pemesanan</h2>
            <ol className="mt-8 space-y-6">
              {steps.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-display text-3xl text-accent">0{i + 1}</span>
                  <div><p className="font-semibold">{t}</p><p className="text-sm opacity-70">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl">Kenapa memilih kami</h2>
            <ul className="mt-8 space-y-4">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3"><Check className="mt-0.5 h-5 w-5 text-accent" />{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {site.testimonials.length > 0 && (
        <section className="container-page py-16">
          <h2 className="text-3xl md:text-4xl">Kata pelanggan</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {site.testimonials.map((t) => (
              <blockquote key={t.name} className="rounded-2xl border bg-card p-6">
                <p>“{t.quote}”</p>
                <footer className="mt-4 text-sm text-muted-foreground">{t.name} · {t.role}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className="container-page grid gap-10 py-20 md:grid-cols-[1fr_1.4fr]">
        <h2 className="text-3xl md:text-4xl">Pertanyaan umum</h2>
        <Accordion type="single" collapsible>
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="container-page">
        <div className="rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-5xl">Siap mulai proyek Anda?</h2>
          <p className="mx-auto mt-3 max-w-md opacity-80">Ceritakan kebutuhan Anda, kami bantu sampai selesai.</p>
          <Button asChild size="lg" variant="accent" className="mt-8"><Link to="/pesan">Pesan sekarang</Link></Button>
        </div>
      </section>
    </>
  );
}
