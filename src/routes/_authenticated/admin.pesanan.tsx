import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListOrders, getMyAdminStatus, updateOrderStatus, updateOrderPayment, getPaymentSettings, savePaymentSettings, type OrderRow } from "@/lib/admin.functions";
import { waLink, site } from "@/config/site";

export const Route = createFileRoute("/_authenticated/admin/pesanan")({
  head: () => ({ meta: [{ title: `Pesanan Masuk — ${site.brandName}` }, { name: "robots", content: "noindex" }] }),
  component: AdminPesanan,
});

const statuses = ["baru", "diproses", "selesai", "batal"] as const;
const statusStyle: Record<string, string> = {
  baru: "bg-secondary text-primary",
  diproses: "bg-secondary text-foreground",
  selesai: "bg-muted text-muted-foreground",
  batal: "bg-muted text-destructive",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function AdminPesanan() {
  const qc = useQueryClient();
  const isAdmin = useQuery({ queryKey: ["admin-status"], queryFn: () => getMyAdminStatus(), staleTime: 60_000 }).data?.isAdmin;
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders(), enabled: Boolean(isAdmin) });
  const paymentSettings = useQuery({ queryKey: ["payment-settings"], queryFn: () => getPaymentSettings(), enabled: Boolean(isAdmin) });
  const [dpPercent, setDpPercent] = useState<number | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const currentDp = dpPercent ?? paymentSettings.data?.dp_percent ?? 50;

  const saveDp = async () => {
    try {
      await savePaymentSettings({ data: { dp_percent: currentDp } });
      setDpPercent(currentDp);
      qc.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success("Persentase DP disimpan");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan DP"); }
  };

  const setPayment = async (o: OrderRow, payment_status: "belum_dibayar" | "menunggu_verifikasi" | "dp_dibayar" | "lunas" | "gagal" | "dibatalkan") => {
    try {
      const amountText = amounts[o.id];
      const total_amount = amountText !== undefined && amountText.trim() !== "" ? Number(amountText) : undefined;
      await updateOrderPayment({ data: { id: o.id, payment_status, ...(total_amount !== undefined && Number.isFinite(total_amount) ? { total_amount, dp_percent: currentDp } : {}), ...(notes[o.id] !== undefined ? { payment_note: notes[o.id] } : {}) } });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Pembayaran diperbarui");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal memperbarui pembayaran"); }
  };

  const setStatus = async (o: OrderRow, status: string) => {
    try {
      await updateOrderStatus({ data: { id: o.id, status: status as (typeof statuses)[number] } });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status");
    }
  };

  return (
    <AdminShell title="Pesanan Masuk">
      <div className="grid gap-4">
        {((orders.data ?? []) as OrderRow[]).map((o) => (
          <article key={o.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{o.name} <span className="font-normal text-muted-foreground">· {o.service_name} · {o.pkg}</span></p>
                <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(o.created_at)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[o.status] ?? "bg-muted"}`}>{o.status}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{o.description}</p>\n            <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-xs">\n              <p><strong>Metode bayar:</strong> {o.payment_method === "tunai" ? "Tunai / bayar langsung" : "Transfer / QRIS"}</p>\n              <p className="mt-1"><strong>Status pembayaran:</strong> {(o.payment_status ?? "belum_dibayar").replaceAll("_", " ")}</p>\n              {o.total_amount != null && <p className="mt-1"><strong>Total:</strong> {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(o.total_amount)} · <strong>DP:</strong> {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(o.dp_amount ?? Math.round(o.total_amount * (o.dp_percent ?? currentDp) / 100))}</p>}\n              {o.payment_note && <p className="mt-1"><strong>Catatan pembayaran:</strong> {o.payment_note}</p>}\n            </div>
            <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <div>Kontak: {o.contact}</div>
              {o.quantity && <div>Jumlah: {o.quantity}</div>}
              {o.deadline && <div>Deadline: {o.deadline}</div>}
              {o.reference && <div className="break-all">Referensi: {o.reference}</div>}
              {o.notes && <div className="sm:col-span-2">Catatan: {o.notes}</div>}
            </dl>
            <div className="mt-4 grid gap-3 rounded-xl border p-3 sm:grid-cols-2">\n              <label className="grid gap-1 text-xs text-muted-foreground">Total harga (Rp)\n                <input type="number" min={0} value={amounts[o.id] ?? (o.total_amount == null ? "" : String(o.total_amount))} onChange={(e) => setAmounts((prev) => ({ ...prev, [o.id]: e.target.value }))} placeholder="Isi total yang disepakati" className="h-9 rounded-md border bg-background px-3 text-sm text-foreground" />\n              </label>\n              <label className="grid gap-1 text-xs text-muted-foreground">Status pembayaran\n                <select value={o.payment_status ?? "belum_dibayar"} onChange={(e) => setPayment(o, e.target.value as "belum_dibayar" | "menunggu_verifikasi" | "dp_dibayar" | "lunas" | "gagal" | "dibatalkan")} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground">\n                  <option value="belum_dibayar">Belum dibayar</option><option value="menunggu_verifikasi">Menunggu verifikasi</option><option value="dp_dibayar">DP dibayar</option><option value="lunas">Lunas</option><option value="gagal">Gagal</option><option value="dibatalkan">Dibatalkan</option>\n                </select>\n              </label>\n              <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">Catatan pembayaran (opsional)\n                <input value={notes[o.id] ?? o.payment_note ?? ""} onChange={(e) => setNotes((prev) => ({ ...prev, [o.id]: e.target.value }))} placeholder="Mis. tunai diterima / instruksi transfer" className="h-9 rounded-md border bg-background px-3 text-sm text-foreground" />\n              </label>\n              <button onClick={() => setPayment(o, (o.payment_status ?? "belum_dibayar") as "belum_dibayar" | "menunggu_verifikasi" | "dp_dibayar" | "lunas" | "gagal" | "dibatalkan")} className="h-9 rounded-full border px-4 text-xs font-semibold">Simpan nominal & catatan</button>\n            </div>\n            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Status
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o, e.target.value)}
                  className="h-8 rounded-md border bg-card px-2 text-xs text-foreground"
                >
                  {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </label>
              {/^(\+?62|0)8\d{7,12}$/.test(o.contact.replace(/[\s-]/g, "")) && (
                <a
                  href={waLink(`Halo ${o.name}, saya admin ${site.brandName} menindaklanjuti pesanan ${o.service_name} Anda.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary"
                >
                  Hubungi via WhatsApp →
                </a>
              )}
            </div>
          </article>
        ))}
        {orders.data !== undefined && (orders.data as OrderRow[]).length === 0 && (
          <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">Belum ada pesanan masuk.</p>
        )}
      </div>
    </AdminShell>
  );
}
