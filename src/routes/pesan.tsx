import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/Layout";
import { rupiah, services } from "@/data/services";
import { site, waLink } from "@/config/site";
import { buildOrderMessage, orderSchema, type Order } from "@/lib/order";

export const Route = createFileRoute("/pesan")({
  validateSearch: (s: Record<string, unknown>): { layanan?: string } => ({ layanan: typeof s.layanan === "string" ? s.layanan : undefined }),
  head: () => ({
    meta: [
      { title: `Pesan Layanan — ${site.brandName}` },
      { name: "description", content: "Isi formulir pemesanan dan kirim ringkasannya melalui WhatsApp." },
      { property: "og:title", content: `Pesan Layanan — ${site.brandName}` },
      { property: "og:description", content: "Isi formulir pemesanan dan kirim ringkasannya melalui WhatsApp." },
    ],
  }),
  component: OrderPage,
});

const available = services.filter((s) => s.available);
const selectCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";

function OrderPage() {
  const { layanan } = Route.useSearch();
  const [f, setF] = useState<Order>({
    name: "", contact: "", service: available.some((s) => s.slug === layanan) ? layanan! : "", pkg: "",
    quantity: "", description: "", reference: "", deadline: "", notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Order, string>>>({});
  const [review, setReview] = useState<Order | null>(null);
  const svc = services.find((s) => s.slug === f.service);
  const set = (k: keyof Order) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value, ...(k === "service" ? { pkg: "" } : {}) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = orderSchema.safeParse(f);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as keyof Order] ??= i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setReview(r.data);
  };

  const field = (k: keyof Order, label: string, el: React.ReactNode, req = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}{req && <span className="text-destructive"> *</span>}</Label>
      {el}
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  if (review && svc) {
    const pkg = svc.packages.find((p) => p.name === review.pkg);
    const msg = buildOrderMessage(review, svc.name, site.brandName);
    return (
      <>
        <PageHeader eyebrow="Ringkasan" title="Periksa pesanan Anda">
          Pesanan belum tersimpan. Klik tombol di bawah untuk mengirim ringkasan ini ke WhatsApp kami, lalu admin akan mengonfirmasi.
        </PageHeader>
        <div className="container-page max-w-2xl">
          <div className="rounded-2xl border bg-card p-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
              {([["Nama", review.name], ["Kontak", review.contact], ["Layanan", svc.name], ["Paket", `${review.pkg}${pkg ? ` (mulai ${rupiah(pkg.price)})` : ""}`], ["Jumlah", review.quantity], ["Deskripsi", review.description], ["Referensi", review.reference], ["Deadline", review.deadline], ["Catatan", review.notes]] as const)
                .filter(([, v]) => v)
                .map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="whitespace-pre-wrap">{v}</dd></div>))}
            </dl>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Harga yang tertera adalah harga dasar. Harga final dikonfirmasi oleh admin.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg"><a href={waLink(msg)} target="_blank" rel="noreferrer"><MessageCircle />Kirim via WhatsApp</a></Button>
            <Button size="lg" variant="outline" onClick={() => setReview(null)}>Ubah pesanan</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Pemesanan" title="Ceritakan kebutuhan Anda">Isi formulir, periksa ringkasan, lalu kirim melalui WhatsApp.</PageHeader>
      <form onSubmit={submit} noValidate className="container-page grid max-w-3xl gap-5 sm:grid-cols-2">
        {field("name", "Nama", <Input id="name" value={f.name} onChange={set("name")} />, true)}
        {field("contact", "WhatsApp atau email", <Input id="contact" value={f.contact} onChange={set("contact")} placeholder="08xx atau nama@email.com" />, true)}
        {field("service", "Layanan", (
          <select id="service" value={f.service} onChange={set("service")} className={selectCls}>
            <option value="">Pilih layanan</option>
            {available.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        ), true)}
        {field("pkg", "Paket", (
          <select id="pkg" value={f.pkg} onChange={set("pkg")} className={selectCls} disabled={!svc}>
            <option value="">{svc ? "Pilih paket" : "Pilih layanan dulu"}</option>
            {svc?.packages.map((p) => <option key={p.name} value={p.name}>{p.name} — {rupiah(p.price)}</option>)}
          </select>
        ), true)}
        {field("quantity", "Jumlah / kebutuhan", <Input id="quantity" value={f.quantity} onChange={set("quantity")} placeholder="mis. 3 poster, 40 halaman" />)}
        {field("deadline", "Deadline yang diinginkan", <Input id="deadline" type="date" value={f.deadline} onChange={set("deadline")} />)}
        <div className="sm:col-span-2">{field("description", "Deskripsi pesanan", <Textarea id="description" rows={5} value={f.description} onChange={set("description")} />, true)}</div>
        <div className="sm:col-span-2">{field("reference", "Referensi desain (tautan)", <Input id="reference" value={f.reference} onChange={set("reference")} placeholder="Tautan Google Drive, Pinterest, dll." />)}</div>
        <div className="sm:col-span-2">{field("notes", "Catatan tambahan", <Textarea id="notes" rows={3} value={f.notes} onChange={set("notes")} />)}</div>
        <div className="sm:col-span-2"><Button type="submit" size="lg">Lihat ringkasan</Button></div>
      </form>
    </>
  );
}
