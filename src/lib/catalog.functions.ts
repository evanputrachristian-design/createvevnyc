import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { orderSchema } from "@/lib/order";
import type { ServiceRow } from "@/lib/catalog";

/** Klien publik sisi-server dengan kunci publishable (RLS sebagai anon). */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listPublicServices = createServerFn({ method: "GET" }).handler(async (): Promise<ServiceRow[]> => {
  const { data, error } = await publicClient().from("services").select("*").order("sort_order");
  if (error) throw new Error("Gagal memuat layanan");
  return (data ?? []) as unknown as ServiceRow[];
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: svc } = await sb.from("services").select("name").eq("slug", data.service).maybeSingle();
    const clean = (v?: string) => (v && v.trim() ? v.trim() : null);
    const { data: inserted, error } = await sb
      .from("orders")
      .insert({
        name: data.name,
        contact: data.contact,
        service_name: svc?.name ?? data.service,
        pkg: data.pkg,
        quantity: clean(data.quantity),
        description: data.description,
        reference: clean(data.reference),
        deadline: clean(data.deadline),
        notes: clean(data.notes),
      })
      .select("id")
      .single();
    if (error) throw new Error("Pesanan gagal disimpan");
    return { id: inserted.id };
  });
