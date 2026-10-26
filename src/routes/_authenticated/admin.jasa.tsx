import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { adminListServices, deleteService, saveService, getMyAdminStatus } from "@/lib/admin.functions";
import { imageFor, type ServiceRow } from "@/lib/catalog";
import { categories, rupiah } from "@/data/services";
import { site } from "@/config/site";

export const Route = createFileRoute("/_authenticated/admin/jasa")({
  head: () => ({ meta: [{ title: `Kelola Jasa — ${site.brandName}` }, { name: "robots", content: "noindex" }] }),
  component: AdminJasa,
});

type FormState = {
  id?: string;
  name: string;
  category: string;
  short: string;
  description: string;
  price: string;
  discount_price: string;
  duration: string;
  available: boolean;
  featured: boolean;
  photo_path: string | null;
  image_key: string | null;
};

const emptyForm: FormState = {
  name: "", category: "", short: "", description: "", price: "", discount_price: "", duration: "",
  available: true, featured: false, photo_path: null, image_key: null,
};

function AdminJasa() {
  const qc = useQueryClient();
  const isAdmin = useQuery({ queryKey: ["admin-status"], queryFn: () => getMyAdminStatus(), staleTime: 60_000 }).data?.isAdmin;
  const services = useQuery({ queryKey: ["admin-services"], queryFn: () => adminListServices(), enabled: Boolean(isAdmin) });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const openEdit = (s: ServiceRow) => {
    setForm({
      id: s.id, name: s.name, category: s.category, short: s.short, description: s.description,
      price: String(s.price), discount_price: s.discount_price != null ? String(s.discount_price) : "", duration: s.duration, available: s.available, featured: s.featured,
      photo_path: s.photo_path, image_key: s.image_key,
    });
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Harga tidak valid");
      return;
    }
    const discount_price = form.discount_price.trim() !== "" ? Number(form.discount_price) : null;
    if (discount_price !== null) {
      if (!Number.isFinite(discount_price) || discount_price < 0) {
        toast.error("Harga diskon tidak valid");
        return;
      }
      if (discount_price >= price) {
        toast.error("Harga diskon harus lebih kecil dari harga normal");
        return;
      }
    }
    setSaving(true);
    try {
      let photo_path = form.photo_path;
      if (file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("service-photos").upload(path, file, { contentType: file.type });
        if (upErr) throw new Error("Unggah foto gagal: " + upErr.message);
        photo_path = path;
      }
      await saveService({
        data: {
          id: form.id,
          name: form.name,
          category: form.category,
          short: form.short,
          description: form.description,
          price,
          discount_price,
          duration: form.duration,
          available: form.available,
          featured: form.featured,
          photo_path,
        },
      });
      toast.success(form.id ? "Perubahan tersimpan" : "Jasa baru ditambahkan");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: ServiceRow) => {
    if (!window.confirm(`Hapus jasa "${s.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteService({ data: { id: s.id } });
      toast.success("Jasa dihapus");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  return (
    <AdminShell title="Kelola Jasa">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus /> Tambah jasa</Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-4 font-medium">Jasa</th>
              <th className="p-4 font-medium">Kategori</th>
              <th className="p-4 font-medium">Harga mulai</th>
              <th className="p-4 font-medium">Harga promo</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {((services.data ?? []) as ServiceRow[]).map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={imageFor(s.image_key, s.photo_path)} alt="" className="h-10 w-14 rounded-lg object-cover" />
                    <span className="font-semibold">{s.name}</span>
                  </div>
                </td>
                <td className="p-4">{s.category}</td>
                <td className="p-4">{rupiah(s.price)}</td>
                <td className="p-4">{s.discount_price != null ? <><span className="font-semibold text-primary">{rupiah(s.discount_price)}</span><span className="ml-2 text-xs text-muted-foreground line-through">{rupiah(s.price)}</span></> : <span className="text-muted-foreground">—</span>}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.available ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}>
                    {s.available ? "Tersedia" : "Nonaktif"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label={`Ubah ${s.name}`}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s)} aria-label={`Hapus ${s.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.data !== undefined && (services.data as ServiceRow[]).length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Belum ada jasa.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Ubah jasa" : "Tambah jasa"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="j-name">Nama jasa *</Label>
              <Input id="j-name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="j-cat">Kategori *</Label>
                <Input id="j-cat" required list="kategori-list" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <datalist id="kategori-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-price">Harga mulai (Rp) *</Label>
                <Input id="j-price" required type="number" min={0} step={1000} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-discount">Harga promo / diskon (Rp) (opsional)</Label>
              <Input id="j-discount" type="number" min={0} step={1000} placeholder="Kosongkan jika tidak ada promo" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-short">Deskripsi singkat</Label>
              <Input id="j-short" value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-desc">Deskripsi lengkap</Label>
              <Textarea id="j-desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="j-dur">Estimasi pengerjaan</Label>
                <Input id="j-dur" placeholder="mis. 1–3 hari kerja" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-photo">Foto jasa</Label>
                <Input id="j-photo" ref={fileInput} type="file" accept="image/*" onChange={pickFile} />
              </div>
            </div>
            {(preview ?? (form.photo_path || form.image_key ? imageFor(form.image_key, form.photo_path) : null)) && (
              <img
                src={preview ?? imageFor(form.image_key, form.photo_path)}
                alt="Pratinjau foto"
                className="aspect-[4/3] w-full max-w-xs rounded-xl object-cover"
              />
            )}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                Tampil di katalog publik
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                Jadikan layanan pilihan
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
