import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, buildOrderMessage, type Order } from "../lib/order";
import { listPublicServices, getPublicQrisImagePath } from "@/lib/catalog.functions";
import { createPaymentFlowOrder, getPaymentFlowStatus } from "@/lib/payment-flow.functions";
import { toService } from "@/lib/catalog";
import { site, waLink } from "../config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/pesan")({
  validateSearch: (s: Record<string, unknown>): { layanan?: string | undefined } => ({
    layanan: typeof s["layanan"] === "string" ? s["layanan"] : undefined,
  }),
  loader: async () => {
    const rows = await listPublicServices();
    return { services: rows.map(toService) };
  },
  head: () => ({
    meta: [
      { title: `Formulir Pemesanan — ${site.brandName}` },
      { name: "description", content: `Isi formulir pemesanan ${site.brandName}; detail pesanan tersimpan dan dilanjutkan melalui WhatsApp.` },
      { property: "og:title", content: `Formulir Pemesanan — ${site.brandName}` },
      { property: "og:description", content: `Isi formulir pemesanan ${site.brandName}; detail pesanan tersimpan dan dilanjutkan melalui WhatsApp.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pesan,
});

function Pesan() {
  const { services } = Route.useLoaderData();
  const { layanan } = Route.useSearch();
  const [review, setReview] = useState<Order | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [qrisImagePath, setQrisImagePath] = useState<string | null>(null);
  const [qrisLoaded, setQrisLoaded] = useState(false);
  const [paymentFlow, setPaymentFlow] = useState<{ id: string; waitingToken: string; status: string; accessCode: string | null } | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Order>({
    resolver: zodResolver(orderSchema),
    defaultValues: { service: layanan ?? "", payment_method: "transfer" },
  });
  const svcSlug = watch("service");
  const svc = services.find((s) => s.slug === svcSlug);

  const submit = async (data: Order) => {
    setSaveError(null);
    setQrisImagePath(null);
    setQrisLoaded(false);
    try {
      const created = await createPaymentFlowOrder({ data });
      setPaymentFlow({ id: created.order.id, waitingToken: created.waitingToken, status: created.order.payment_flow_status, accessCode: null });
      try { localStorage.setItem("createvevnyc:pending-order", JSON.stringify({ id: created.order.id, waitingToken: created.waitingToken })); } catch { /* storage may be disabled; current page session still works */ }
    } catch {
      setSaveError("Pesanan gagal tersimpan di sistem kami, tetapi Anda tetap bisa mengirimnya langsung lewat WhatsApp di bawah.");
    }
    if (data.payment_method === "transfer") {
      try {
        setQrisImagePath(await getPublicQrisImagePath());
      } catch {
        setQrisImagePath(null);
      }
      setQrisLoaded(true);
    }
    setReview(data);
  };

  useEffect(() => {
    if (!paymentFlow) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const result = await getPaymentFlowStatus({ data: { orderId: paymentFlow.id, waitingToken: paymentFlow.waitingToken } });
        if (!cancelled) setPaymentFlow((prev) => prev ? { ...prev, status: result.order.payment_flow_status, accessCode: result.accessCode } : prev);
      } catch { /* Keep the last known state; transient network errors are not fatal. */ }
    };
    void poll();
    const timer = window.setInterval(() => { void poll(); }, 7000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [paymentFlow?.id, paymentFlow?.waitingToken]);

  if (review) {
    const name = services.find((s) => s.slug === review.service)?.name ?? review.service;
    const msg = buildOrderMessage(review, name, site.brandName);
    return (
      <div className="container-page max-w-2xl py-16">
        <h1>Ringkasan Pesanan</h1>
        {saveError ? (
          <p className="mt-4 rounded-xl border border-destructive/40 bg-card p-4 text-sm text-destructive">{saveError}</p>
        ) : (
          <p className="mt-4 rounded-xl bg-secondary p-4 text-sm text-primary">
            Pesanan Anda sudah tersimpan di sistem kami. Untuk mempercepat kesepakatan, kirim juga ringkasannya lewat WhatsApp.
          </p>
        )}
        <pre className="mt-6 whitespace-pre-wrap rounded-2xl border bg-card p-6 font-body text-sm">{msg}</pre>
        {paymentFlow && (
          <section className="mt-4 rounded-xl border bg-secondary/50 p-4 text-left">
            <p className="text-sm font-semibold">Nomor pesanan</p>
            <p className="mt-1 break-all font-mono text-xs">{paymentFlow.id}</p>
            <p className="mt-3 text-sm"><strong>Status pembayaran:</strong> {paymentFlow.status.replaceAll("_", " ")}</p>
            {paymentFlow.status === "menunggu_pembayaran" && <p className="mt-2 text-xs text-muted-foreground">Tunggu admin meninjau pesanan dan menyepakati nominal. Jangan mengirim pembayaran sebelum nominal dikonfirmasi.</p>}
            {paymentFlow.status === "menunggu_konfirmasi" && <p className="mt-2 text-xs text-muted-foreground">Pembayaran sedang menunggu pemeriksaan admin.</p>}
            {paymentFlow.status === "dikonfirmasi" && paymentFlow.accessCode && <p className="mt-3 rounded-lg border bg-card p-3 text-sm"><strong>Kode akses pesanan:</strong> <span className="font-mono">{paymentFlow.accessCode}</span><br/>Simpan kode ini. Kode diperlukan untuk melihat detail pesanan.</p>}
            {paymentFlow.status === "ditolak" && <p className="mt-2 text-sm text-destructive">Pesanan atau pembayaran ditolak. Hubungi admin untuk tindak lanjut.</p>}
          </section>
        )}
        {review.payment_method === "transfer" && (
          <section className="mt-6 rounded-2xl border bg-card p-5 text-center">
            <h2 className="text-lg font-semibold">Pembayaran QRIS</h2>
            {!qrisLoaded ? (
              <p className="mt-2 text-sm text-muted-foreground">Memuat informasi pembayaran…</p>
            ) : qrisImagePath ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">Gunakan QRIS resmi yang ditampilkan di bawah setelah admin mengonfirmasi nominal pembayaran.</p>
                <img
                  src={`/api/public/foto/${qrisImagePath.split("/").map(encodeURIComponent).join("/")}`}
                  alt="Kode QRIS pembayaran"
                  className="mx-auto mt-4 max-h-[360px] w-full max-w-xs rounded-xl object-contain"
                  loading="lazy"
                />
                <p className="mt-3 text-xs text-muted-foreground">Pastikan nama merchant dan nominal benar sebelum membayar. Jika gambar tidak tampil, hubungi admin melalui WhatsApp.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">QRIS belum diatur atau belum tersedia. Silakan konfirmasi metode dan nominal pembayaran kepada admin melalui WhatsApp.</p>
            )}
          </section>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={waLink(msg)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Kirim via WhatsApp
          </a>
          <Button variant="outline" onClick={() => setReview(null)} className="h-12 rounded-full">Ubah isi formulir</Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Pembayaran dilakukan setelah detail disepakati. {site.payment.note}</p>
      </div>
    );
  }

  const Field = ({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-center">Formulir Pemesanan</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
        Isi detail kebutuhan Anda. Pesanan tersimpan di sistem kami dan kami tindaklanjuti melalui WhatsApp.
      </p>
      <form onSubmit={handleSubmit(submit)} className="mt-10 grid gap-5 rounded-3xl border bg-card p-6 shadow-soft md:p-8">
        <Field id="f-name" label="Nama lengkap *" error={errors.name?.message}>
          <Input id="f-name" {...register("name")} placeholder="Nama Anda" />
        </Field>
        <Field id="f-contact" label="Nomor WhatsApp atau email *" error={errors.contact?.message}>
          <Input id="f-contact" {...register("contact")} placeholder="08xxxxxxxxxx atau nama@email.com" />
        </Field>
        <Field id="f-service" label="Layanan *" error={errors.service?.message}>
          <select id="f-service" {...register("service")} className="flex h-10 w-full rounded-md border bg-card px-3 text-sm">
            <option value="">Pilih layanan...</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </Field>
        {svc && (
          <Field id="f-pkg" label="Paket *" error={errors.pkg?.message}>
            <select id="f-pkg" {...register("pkg")} className="flex h-10 w-full rounded-md border bg-card px-3 text-sm">
              <option value="">Pilih paket...</option>
              {svc.packages.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </Field>
        )}
        {!svc && <input type="hidden" {...register("pkg")} value="" />}
        <Field id="f-payment-method" label="Metode pembayaran *">
          <select id="f-payment-method" {...register("payment_method")} className="flex h-10 w-full rounded-md border bg-card px-3 text-sm">
            <option value="transfer">Transfer / QRIS (setelah konfirmasi admin)</option>
            <option value="tunai">Tunai (bayar langsung)</option>
          </select>
        </Field>
        <p className="text-xs text-muted-foreground">Pilih metode yang diinginkan. Pembayaran belum diproses otomatis; admin akan mengonfirmasi nominal dan instruksi pembayaran setelah meninjau pesanan.</p>
        <Field id="f-qty" label="Jumlah / kebutuhan (opsional)" error={errors.quantity?.message}>
          <Input id="f-qty" {...register("quantity")} placeholder="mis. 3 poster, 1 video 5 menit" />
        </Field>
        <Field id="f-desc" label="Deskripsi pesanan *" error={errors.description?.message}>
          <Textarea id="f-desc" rows={4} {...register("description")} placeholder="Jelaskan tema, isi, dan gaya yang Anda inginkan" />
        </Field>
        <Field id="f-ref" label="Tautan referensi (opsional)" error={errors.reference?.message}>
          <Input id="f-ref" {...register("reference")} placeholder="https://..." />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="f-deadline" label="Tenggat waktu (opsional)" error={errors.deadline?.message}>
            <Input id="f-deadline" type="date" {...register("deadline")} />
          </Field>
          <Field id="f-notes" label="Catatan tambahan (opsional)" error={errors.notes?.message}>
            <Input id="f-notes" {...register("notes")} />
          </Field>
        </div>
        <Button type="submit" disabled={isSubmitting} className="h-12 rounded-full text-sm font-semibold">
          {isSubmitting ? "Menyimpan..." : "Simpan & lihat ringkasan"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Dengan mengirim formulir Anda menyetujui <Link to="/kontak" className="underline">ketentuan layanan</Link> kami.
        </p>
      </form>
    </div>
  );
}
