import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getTrackedOrder } from "@/lib/payment-flow.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { site } from "@/config/site";

export const Route = createFileRoute("/lacak-pesanan")({
  head: () => ({ meta: [{ title: `Lacak Pesanan — ${site.brandName}` }, { name: "robots", content: "noindex" }] }),
  component: LacakPesanan,
});

function LacakPesanan() {
  const [orderId, setOrderId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setOrder(null);
    try {
      const result = await getTrackedOrder({ data: { orderId: orderId.trim(), accessCode: accessCode.trim().toUpperCase() } });
      setOrder(result.order);
    } catch {
      setError("Nomor pesanan atau kode akses tidak valid, atau layanan sedang tidak tersedia.");
    } finally { setLoading(false); }
  };
  const rupiah = (n: number | null | undefined) => n == null ? "Belum ditentukan" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return <main className="container-page max-w-2xl py-16">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Area pelanggan</p>
    <h1 className="mt-2 text-3xl">Lacak Pesanan</h1>
    <p className="mt-3 text-sm text-muted-foreground">Masukkan ID pesanan dan kode akses yang diberikan setelah pembayaran dikonfirmasi admin. Demi keamanan, data pesanan hanya ditampilkan setelah kedua informasi cocok.</p>
    <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border bg-card p-5">
      <label className="grid gap-1.5 text-sm font-medium">ID pesanan
        <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="UUID pesanan" required autoComplete="off" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">Kode akses
        <Input value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} placeholder="8–10 karakter" required autoComplete="off" maxLength={10} />
      </label>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Memeriksa…" : "Lihat pesanan"}</Button>
    </form>
    {order && <section className="mt-6 rounded-2xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Status pesanan</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">ID pesanan</dt><dd className="break-all font-mono text-xs">{order.id}</dd></div>
        <div><dt className="text-muted-foreground">Dibuat</dt><dd>{new Date(order.created_at).toLocaleString("id-ID")}</dd></div>
        <div><dt className="text-muted-foreground">Layanan</dt><dd>{order.service_name}</dd></div>
        <div><dt className="text-muted-foreground">Paket</dt><dd>{order.pkg}</dd></div>
        <div><dt className="text-muted-foreground">Status pesanan</dt><dd>{order.status}</dd></div>
        <div><dt className="text-muted-foreground">Status pembayaran</dt><dd>{String(order.payment_status ?? "belum_dibayar").replaceAll("_", " ")}</dd></div>
        <div><dt className="text-muted-foreground">Total</dt><dd>{rupiah(order.total_amount)}</dd></div>
        <div><dt className="text-muted-foreground">DP</dt><dd>{rupiah(order.dp_amount)}</dd></div>
      </dl>
      {order.payment_note && <p className="mt-4 rounded-lg bg-secondary p-3 text-sm">{order.payment_note}</p>}
      <p className="mt-4 text-xs text-muted-foreground">Jika ada pertanyaan tentang pembayaran atau pengerjaan, hubungi admin melalui kanal resmi.</p>
    </section>}
  </main>;
}
