import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ClipboardList, ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListOrders, adminListServices, getMyAdminStatus } from "@/lib/admin.functions";
import { site } from "@/config/site";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: `Dasbor Admin — ${site.brandName}` }, { name: "robots", content: "noindex" }] }),
  component: AdminHome,
});

function AdminHome() {
  const isAdmin = useQuery({ queryKey: ["admin-status"], queryFn: () => getMyAdminStatus(), staleTime: 60_000 }).data?.isAdmin;
  const services = useQuery({ queryKey: ["admin-services"], queryFn: () => adminListServices(), enabled: Boolean(isAdmin) });
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders(), enabled: Boolean(isAdmin) });

  const serviceList = (services.data ?? []) as import("@/lib/catalog").ServiceRow[];
  const orderList = (orders.data ?? []) as import("@/lib/admin.functions").OrderRow[];
  const newOrders = orderList.filter((o) => o.status === "baru").length;

  return (
    <AdminShell title="Dasbor">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6">
          <Package className="h-5 w-5 text-accent" />
          <p className="mt-4 font-display text-3xl">{services.data ? serviceList.length : "…"}</p>
          <p className="text-sm text-muted-foreground">Total jasa</p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <ClipboardList className="h-5 w-5 text-accent" />
          <p className="mt-4 font-display text-3xl">{orders.data ? orderList.length : "…"}</p>
          <p className="text-sm text-muted-foreground">Pesanan masuk</p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <ClipboardList className="h-5 w-5 text-primary" />
          <p className="mt-4 font-display text-3xl">{orders.data ? newOrders : "…"}</p>
          <p className="text-sm text-muted-foreground">Pesanan berstatus baru</p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/admin/jasa" className="group flex items-center justify-between rounded-2xl border bg-card p-6 transition-colors hover:border-primary">
          <div>
            <p className="font-semibold">Kelola jasa</p>
            <p className="mt-1 text-sm text-muted-foreground">Tambah, ubah, atau hapus layanan yang tampil di katalog.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
        </Link>
        <Link to="/admin/pesanan" className="group flex items-center justify-between rounded-2xl border bg-card p-6 transition-colors hover:border-primary">
          <div>
            <p className="font-semibold">Lihat pesanan</p>
            <p className="mt-1 text-sm text-muted-foreground">Daftar pesanan yang dikirim pelanggan melalui formulir.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </AdminShell>
  );
}
