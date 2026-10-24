import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site, waLink } from "@/config/site";
import type { Service } from "@/data/services";
import { rupiah, startingPrice } from "@/data/services";

const nav = [
  { to: "/", label: "Beranda" },
  { to: "/layanan", label: "Layanan" },
  { to: "/portofolio", label: "Portofolio" },
  { to: "/tentang", label: "Tentang" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      {site.logoUrl ? (
        <img src={site.logoUrl} alt={site.brandName} className="h-10 w-auto" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm text-primary-foreground">
          {site.logoText}
        </span>
      )}
      <span className="font-display text-lg font-semibold">{site.brandName}</span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/pesan">Pesan sekarang</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="container-page flex flex-col gap-1 pb-4 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-secondary">
              {n.label}
            </Link>
          ))}
          <Button asChild className="mt-2">
            <Link to="/pesan" onClick={() => setOpen(false)}>Pesan sekarang</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl">{site.brandName}</p>
          <p className="mt-3 max-w-sm text-sm opacity-75">{site.tagline}</p>
          <p className="mt-3 text-sm opacity-60">{site.serviceArea}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Menu</p>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="block opacity-75 hover:opacity-100">{n.label}</Link>
          ))}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Kontak</p>
          <a href={waLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 opacity-75 hover:opacity-100"><MessageCircle className="h-4 w-4" />WhatsApp</a>
          <a href={`mailto:${site.email}`} className="flex items-center gap-2 opacity-75 hover:opacity-100"><Mail className="h-4 w-4" />{site.email}</a>
          {site.socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="block opacity-75 hover:opacity-100">{s.label}</a>
          ))}
        </div>
      </div>
      <div className="container-page flex items-center justify-between border-t border-ink-foreground/15 py-5 text-xs opacity-60">
        <span>© {new Date().getFullYear()} {site.brandName}. Dibuat oleh createvevnyc.</span>
        <Link to="/auth" className="hover:opacity-100">Akun</Link>
      </div>
    </footer>
  );
}

export function SampleNotice() {
  if (!site.showSampleNotice) return null;
  return (
    <div className="bg-secondary text-center text-xs text-secondary-foreground">
      <p className="container-page py-2">Harga, portofolio, dan data layanan di situs ini masih berupa contoh.</p>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="container-page pb-10 pt-14 md:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-4xl md:text-6xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-muted-foreground">{children}</div>}
    </section>
  );
}

export function ServiceCard({ s }: { s: Service }) {
  return (
    <Link
      to="/layanan/$slug"
      params={{ slug: s.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={s.image} alt={s.name} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${s.available ? "bg-background text-primary" : "bg-muted text-muted-foreground"}`}>
          {s.available ? "Tersedia" : "Belum tersedia"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-muted-foreground">{s.category}</p>
        <h3 className="mt-1 text-xl">{s.name}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.short}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Mulai dari</p>
            <p className="font-semibold">{rupiah(startingPrice(s))}</p>
          </div>
          <span className="text-sm font-semibold text-primary">Lihat detail →</span>
        </div>
      </div>
    </Link>
  );
}
