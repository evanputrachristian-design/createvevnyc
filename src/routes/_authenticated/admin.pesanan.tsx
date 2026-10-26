import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListOrders, getMyAdminStatus, updateOrderStatus, updateOrderPayment, getPaymentSettings, savePaymentSettings, type OrderRow } from "@/lib/admin.functions";
import { waLink, site } from "@/config/site";
import { adminTransitionPaymentFlow } from "@/lib/payment-flow.functions";

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
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const qrisInputRef = useRef<HTMLInputElement>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const currentDp = dpPercent ?? paymentSettings.data?.dp_percent ?? 50;

  const handleQrisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (qrisPreview) URL.revokeObjectURL(qrisPreview);
    setQrisFile(file);
    setQrisPreview(file ? URL.createObjectURL(file) : null);
  };

  const saveAllPaymentSettings = async () => {
    setSavingSettings(true);
    try {
      let qris_image_path = paymentSettings.data?.qris_image_path ?? null;
      if (qrisFile) {
        const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
        if (!allowedTypes.includes(qrisFile.type)) {
          throw new Error("Format QRIS harus PNG, JPEG, atau WebP.");
        }
        const ext = (qrisFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `qris-${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-assets")
          .upload(path, qrisFile, { contentType: qrisFile.type, upsert: true });
        if (uploadError) throw new Error("Gagal mengunggah foto QRIS. Periksa format file dan izin penyimpanan.");
        qris_image_path = path;
      }
      await savePaymentSettings({ data: { dp_percent: currentDp, qris_image_path } });
      toast.success("Pengaturan pembayaran dan QRIS berhasil disimpan");
      setQrisFile(null);
      if (qrisPreview) URL.revokeObjectURL(qrisPreview);
      setQrisPreview(null);
      if (qrisInputRef.current) qrisInputRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["payment-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
    } finally {
      setSavingSettings(false);
    }
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

  const transitionPaymentFlow = async (o: OrderRow, action: "menunggu_konfirmasi" | "dikonfirmasi" | "ditolak") => {
    try {
      const result = await adminTransitionPaymentFlow({ data: { id: o.id, action, ...(action === "ditolak" ? { rejectionReason: rejectionReasons[o.id] ?? "" } : {}) } });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      if (result.accessCode) toast.success(`Pembayaran dikonfirmasi. Kode akses: ${result.accessCode}`);
      else toast.success("Status alur pembayaran diperbarui");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal memperbarui alur pembayaran"); }
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
      <section className="mb-6 rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-secondary p-2 text-primary"><ImageIcon className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Pengaturan Pembayaran &amp; QRIS Toko</h2>
            <p className="mt-1 text-xs text-muted-foreground">Atur persentase down payment (DP) dan unggah gambar QRIS resmi toko Anda. Gambar ini disajikan aman ke pelanggan melalui rute /api/public/foto/.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Persentase DP: <span className="font-bold text-primary">{currentDp}%</span></label>
            <input type="range" min={0} max={100} step={5} value={currentDp} onChange={(e) => setDpPercent(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
            <div className="flex justify-between gap-2 text-[11px] text-muted-foreground"><span>0% (Lunas di akhir)</span><span>50% (Standar)</span><span>100% (Bayar penuh di awal)</span></div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Foto / Gambar QRIS</label>
            <input ref={qrisInputRef} type="file" accept="image/*" onChange={handleQrisFileChange} className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground hover:file:bg-secondary/80" />
            {(qrisPreview || paymentSettings.data?.qris_image_path) ? (
              <div className="mt-2 flex items-center gap-3">
                <img src={qrisPreview ?? `/api/public/foto/${paymentSettings.data?.qris_image_path}`} alt="Pratinjau QRIS" className="h-24 w-24 rounded-lg border bg-white p-1 object-contain" />
                <span className="text-xs text-muted-foreground">{qrisPreview ? "Gambar baru siap disimpan" : "Gambar QRIS aktif saat ini"}</span>
              </div>
            ) : <p className="text-xs text-muted-foreground">Belum ada foto QRIS yang diunggah.</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveAllPaymentSettings} disabled={savingSettings || paymentSettings.isLoading} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            <Upload className="h-3.5 w-3.5" />{savingSettings ? "Menyimpan..." : "Simpan Pengaturan Pembayaran & QRIS"}
          </button>
        </div>
      </section>
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
            <p className="mt-3 whitespace-pre-wrap text-sm">{o.description}</p>
            <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-xs">
              <p><strong>Metode bayar:</strong> {o.payment_method === "tunai" ? "Tunai / bayar langsung" : "Transfer / QRIS"}</p>
              <p className="mt-1"><strong>Status pembayaran:</strong> {(o.payment_status ?? "belum_dibayar").replaceAll("_", " ")}</p>
              {o.total_amount != null && <p className="mt-1"><strong>Total:</strong> {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(o.total_amount)} · <strong>DP:</strong> {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(o.dp_amount ?? Math.round(o.total_amount * (o.dp_percent ?? currentDp) / 100))}</p>}
              {o.payment_note && <p className="mt-1"><strong>Catatan pembayaran:</strong> {o.payment_note}</p>}
            </div>
            <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <div>Kontak: {o.contact}</div>
              {o.quantity && <div>Jumlah: {o.quantity}</div>}
              {o.deadline && <div>Deadline: {o.deadline}</div>}
              {o.reference && <div className="break-all">Referensi: {o.reference}</div>}
              {o.notes && <div className="sm:col-span-2">Catatan: {o.notes}</div>}
            </dl>
            <div className="mt-4 grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs text-muted-foreground">Total harga (Rp)
                <input type="number" min={0} value={amounts[o.id] ?? (o.total_amount == null ? "" : String(o.total_amount))} onChange={(e) => setAmounts((prev) => ({ ...prev, [o.id]: e.target.value }))} placeholder="Isi total yang disepakati" className="h-9 rounded-md border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">Status pembayaran
                <select value={o.payment_status ?? "belum_dibayar"} onChange={(e) => setPayment(o, e.target.value as "belum_dibayar" | "menunggu_verifikasi" | "dp_dibayar" | "lunas" | "gagal" | "dibatalkan")} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground">
                  <option value="belum_dibayar">Belum dibayar</option><option value="menunggu_verifikasi">Menunggu verifikasi</option><option value="dp_dibayar">DP dibayar</option><option value="lunas">Lunas</option><option value="gagal">Gagal</option><option value="dibatalkan">Dibatalkan</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">Catatan pembayaran (opsional)
                <input value={notes[o.id] ?? o.payment_note ?? ""} onChange={(e) => setNotes((prev) => ({ ...prev, [o.id]: e.target.value }))} placeholder="Mis. tunai diterima / instruksi transfer" className="h-9 rounded-md border bg-background px-3 text-sm text-foreground" />
              </label>
              <button onClick={() => setPayment(o, (o.payment_status ?? "belum_dibayar") as "belum_dibayar" | "menunggu_verifikasi" | "dp_dibayar" | "lunas" | "gagal" | "dibatalkan")} className="h-9 rounded-full border px-4 text-xs font-semibold">Simpan nominal & catatan</button>
            </div>
            <div className="mt-4 rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Alur pembayaran: <span className="capitalize">{(o.payment_flow_status ?? "menunggu_pembayaran").replaceAll("_", " ")}</span></p>
                {o.payment_flow_status === "dikonfirmasi" && o.access_code && <p className="font-mono text-xs">Kode akses: {o.access_code}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(o.payment_flow_status ?? "menunggu_pembayaran") === "menunggu_pembayaran" && <button onClick={() => transitionPaymentFlow(o, "menunggu_konfirmasi")} className="h-9 rounded-full border px-4 text-xs font-semibold">Tandai menunggu konfirmasi</button>}
                {o.payment_flow_status === "menunggu_konfirmasi" && <>
                  <button onClick={() => transitionPaymentFlow(o, "dikonfirmasi")} className="h-9 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground">Konfirmasi pembayaran</button>
                  <input value={rejectionReasons[o.id] ?? ""} onChange={(e) => setRejectionReasons((p) => ({ ...p, [o.id]: e.target.value }))} maxLength={1000} placeholder="Alasan penolakan (opsional)" className="h-9 min-w-48 flex-1 rounded-md border bg-background px-3 text-sm" />
                  <button onClick={() => transitionPaymentFlow(o, "ditolak")} className="h-9 rounded-full border border-destructive/50 px-4 text-xs font-semibold text-destructive">Tolak</button>
                </>}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Konfirmasi hanya setelah bukti transfer diperiksa. Kode akses ditampilkan kepada admin setelah konfirmasi.</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
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
