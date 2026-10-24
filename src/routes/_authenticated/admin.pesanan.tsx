import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListOrders, getMyAdminStatus, updateOrderStatus, type OrderRow } from "@/lib/admin.functions";
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
            <p className="mt-3 whitespace-pre-wrap text-sm">{o.description}</p>
            <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <div>Kontak: {o.contact}</div>
              {o.quantity && <div>Jumlah: {o.quantity}</div>}
              {o.deadline && <div>Deadline: {o.deadline}</div>}
              {o.reference && <div className="break-all">Referensi: {o.reference}</div>}
              {o.notes && <div className="sm:col-span-2">Catatan: {o.notes}</div>}
            </dl>
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
