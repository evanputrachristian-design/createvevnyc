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
  payment_method?: "transfer" | "tunai";
  payment_status?: "belum_dibayar" | "menunggu_verifikasi" | "dp_dibayar" | "lunas" | "gagal" | "dibatalkan";
  total_amount?: number | null;
  dp_percent?: number;
  dp_amount?: number | null;
  payment_note?: string | null;
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


export const updateOrderPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      payment_status: z.enum(["belum_dibayar", "menunggu_verifikasi", "dp_dibayar", "lunas", "gagal", "dibatalkan"]),
      total_amount: z.number().int().min(0).nullable().optional(),
      dp_percent: z.number().int().min(0).max(100).optional(),
      payment_note: z.string().trim().max(500).nullable().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const patch: Record<string, unknown> = { payment_status: data.payment_status };
    if (data.total_amount !== undefined) {
      patch.total_amount = data.total_amount;
      if (data.total_amount !== null) {
        const { data: settings } = await ctx.supabase.from("payment_settings").select("dp_percent, qris_image_path").eq("id", 1).maybeSingle();
        const percent = data.dp_percent ?? settings?.dp_percent ?? 50;
        patch.dp_percent = percent;
        patch.dp_amount = Math.round(data.total_amount * percent / 100);
      }
    }
    if (data.dp_percent !== undefined) {
      patch.dp_percent = data.dp_percent;
      if (data.total_amount !== undefined && data.total_amount !== null) patch.dp_amount = Math.round(data.total_amount * data.dp_percent / 100);
    }
    if (data.payment_note !== undefined) patch.payment_note = data.payment_note;
    const { data: updated, error } = await ctx.supabase
      .from("orders")
      .update(patch)
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[admin.updateOrderPayment] Supabase update failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      if (error.code === "42703" || error.code === "PGRST204" || error.code === "PGRST205") {
        throw new Error("Kolom pembayaran belum tersedia di database. Terapkan drizzle/migrations/0001_payment_tracking.sql di Supabase SQL Editor, lalu coba lagi.");
      }
      if (error.code === "42501" || error.code === "PGRST301") {
        throw new Error("Akses database ditolak. Periksa peran admin dan kebijakan RLS tabel orders.");
      }
      throw new Error("Database menolak perubahan pembayaran. Periksa log server untuk kode error Supabase.");
    }
    if (!updated) {
      throw new Error("Pesanan tidak ditemukan atau tidak dapat diubah. Muat ulang daftar pesanan dan coba lagi.");
    }
    return { ok: true };
  });

export const getPaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase.from("payment_settings").select("dp_percent, qris_image_path").eq("id", 1).maybeSingle();
    if (error) throw new Error("Gagal memuat pengaturan DP");
    return { dp_percent: data?.dp_percent ?? 50, qris_image_path: data?.qris_image_path ?? null };
  });

export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ dp_percent: z.number().int().min(0).max(100).optional(), qris_image_path: z.string().max(500).nullable().optional() }).refine((v) => v.dp_percent !== undefined || v.qris_image_path !== undefined, "Tidak ada pengaturan yang diubah").parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.dp_percent !== undefined) patch.dp_percent = data.dp_percent;
    if (data.qris_image_path !== undefined) patch.qris_image_path = data.qris_image_path;
    const { error } = await ctx.supabase.from("payment_settings").update(patch).eq("id", 1);
    if (error) throw new Error("Gagal menyimpan pengaturan DP");
    return { ok: true };
  });
