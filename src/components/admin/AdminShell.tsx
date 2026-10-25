import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LayoutDashboard, Package, ClipboardList, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminStatus } from "@/lib/admin.functions";

const menu = [
  { to: "/admin", label: "Dasbor", icon: LayoutDashboard, exact: true },
  { to: "/admin/jasa", label: "Kelola Jasa", icon: Package, exact: false },
  { to: "/admin/pesanan", label: "Pesanan Masuk", icon: ClipboardList, exact: false },
] as const;

/** Kerangka halaman admin: memeriksa peran admin di server dan menyediakan navigasi. */
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => getMyAdminStatus(), staleTime: 60_000 });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (status.isLoading) {
    return <div className="container-page py-24 text-center text-muted-foreground">Memeriksa akses...</div>;
  }
  if (status.isError) {
    return (
      <div className="container-page max-w-lg py-24 text-center">
        <h1 className="text-3xl">Pemeriksaan admin gagal</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Status admin tidak dapat diverifikasi oleh server. Ini belum tentu berarti akun Anda bukan admin.
        </p>
        <p className="mt-2 break-words text-xs text-muted-foreground">
          {status.error instanceof Error ? status.error.message : "Kesalahan tidak diketahui"}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => status.refetch()}>Coba lagi</Button>
      </div>
    );
  }
  if (!status.data?.isAdmin) {
    return (
      <div className="container-page max-w-md py-24 text-center">
        <h1 className="text-3xl">Akses ditolak</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Akun Anda tidak memiliki peran admin. Minta pemilik situs untuk memberikan akses, lalu coba lagi.
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut}>Keluar dari akun ini</Button>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[14rem_1fr]">
      <aside>
        <nav className="flex gap-1 overflow-auto lg:flex-col">
          {menu.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              activeOptions={{ exact: m.exact }}
              className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground font-semibold" }}
            >
              <m.icon className="h-4 w-4" />
              {m.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </nav>
      </aside>
      <section className="min-w-0">
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
