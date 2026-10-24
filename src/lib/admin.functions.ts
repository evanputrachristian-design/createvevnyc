import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ServiceRow } from "@/lib/catalog";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Akses ditolak: bukan admin");
}

export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
    return { isAdmin: Boolean(data) };
  });

export const adminListServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServiceRow[]> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase.from("services").select("*").order("sort_order");
    if (error) throw new Error("Gagal memuat layanan");
    return (data ?? []) as unknown as ServiceRow[];
  });

const serviceInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(150),
  category: z.string().trim().min(1, "Kategori wajib diisi").max(100),
  short: z.string().trim().max(300).default(""),
  description: z.string().trim().max(3000).default(""),
  price: z.number().int().min(0),
  duration: z.string().trim().max(100).default(""),
  available: z.boolean(),
  featured: z.boolean(),
  photo_path: z.string().trim().max(500).nullable().optional(),
});

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "jasa";

export const saveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => serviceInput.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    if (data.id) {
      const { error } = await ctx.supabase
        .from("services")
        .update({
          name: data.name,
          category: data.category,
          short: data.short,
          description: data.description,
          price: data.price,
          duration: data.duration,
          available: data.available,
          featured: data.featured,
          photo_path: data.photo_path ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      if (error) throw new Error("Gagal menyimpan perubahan");
      return { id: data.id };
    }
    const base = slugify(data.name);
    const { data: existing } = await ctx.supabase.from("services").select("slug").ilike("slug", `${base}%`);
    const taken = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
    let slug = base;
    let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;
    const { data: maxRow } = await ctx.supabase.from("services").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data: inserted, error } = await ctx.supabase
      .from("services")
      .insert({
        slug,
        name: data.name,
        category: data.category,
        short: data.short,
        description: data.description,
        price: data.price,
        duration: data.duration,
        available: data.available,
        featured: data.featured,
        photo_path: data.photo_path ?? null,
        sort_order: (maxRow?.sort_order ?? 0) + 1,
      })
      .select("id")
      .single();
    if (error) throw new Error("Gagal menambah layanan");
    return { id: inserted.id as string };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error("Gagal menghapus layanan");
    return { ok: true };
  });

export type OrderRow = {
  id: string;
  created_at: string;
  name: string;
  contact: string;
  service_name: string;
  pkg: string;
  quantity: string | null;
  description: string;
  reference: string | null;
  deadline: string | null;
  notes: string | null;
  status: string;
};

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrderRow[]> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error("Gagal memuat pesanan");
    return (data ?? []) as unknown as OrderRow[];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["baru", "diproses", "selesai", "batal"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("Gagal memperbarui status");
    return { ok: true };
  });
