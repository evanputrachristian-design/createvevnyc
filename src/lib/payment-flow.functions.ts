import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orderSchema } from "@/lib/order";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";

type PaymentFlowStatus = "menunggu_pembayaran" | "menunggu_konfirmasi" | "dikonfirmasi" | "ditolak";
type OrderDb = {
  id: string; created_at: string; name: string; contact: string; service_name: string;
  pkg: string; payment_flow_status: PaymentFlowStatus; total_amount: number | null;
  dp_percent: number | null; dp_amount: number | null; payment_note: string | null;
  access_code: string | null; confirmed_at: string | null; rejected_at: string | null;
};

/** Web Crypto is available in Cloudflare Workers and modern server runtimes. */
function randomToken(bytes = 32): string {
  const raw = new Uint8Array(bytes);
  crypto.getRandomValues(raw);
  return Array.from(raw, (v) => v.toString(16).padStart(2, "0")).join("");
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
}
function clean(v?: string) { return v && v.trim() ? v.trim() : null; }
function safeOrder(row: OrderDb) {
  return {
    id: row.id,
    created_at: row.created_at,
    name: row.name,
    service_name: row.service_name,
    pkg: row.pkg,
    payment_flow_status: row.payment_flow_status,
    total_amount: row.total_amount,
    dp_percent: row.dp_percent,
    dp_amount: row.dp_amount,
    payment_note: row.payment_note,
    confirmed_at: row.confirmed_at,
    rejected_at: row.rejected_at,
    // Never return the access code to the waiting-room endpoint.
  };
}
async function adminContext(context: unknown) {
  const ctx = context as { supabase: any; userId: string };
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error || data !== true) throw new Error("Akses ditolak");
  return ctx;
}
async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const createPaymentFlowOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: svc, error: svcError } = await sb.from("services").select("name").eq("slug", data.service).maybeSingle();
    if (svcError || !svc?.name) throw new Error("Layanan tidak tersedia");
    const token = randomToken(32);
    const tokenHash = await sha256(token);
    const cleanValue = (v?: string) => clean(v);
    const { data: inserted, error } = await sb.from("orders").insert({
      name: data.name, contact: data.contact, service_name: svc.name, pkg: data.pkg,
      payment_method: data.payment_method, payment_status: "belum_dibayar",
      quantity: cleanValue(data.quantity), description: data.description,
      reference: cleanValue(data.reference), deadline: cleanValue(data.deadline), notes: cleanValue(data.notes),
      payment_flow_status: "menunggu_pembayaran", is_legacy_order: false, waiting_token_hash: tokenHash,
      access_code: null, confirmed_at: null, confirmed_by: null, rejected_at: null, rejected_by: null, rejection_reason: null,
    }).select("id,created_at,name,service_name,pkg,payment_flow_status,total_amount,dp_percent,dp_amount,payment_note,access_code,confirmed_at,rejected_at").single();
    if (error || !inserted) {
      console.error("[PaymentFlow] create order failed:", error?.message);
      throw new Error("Pesanan gagal disimpan. Silakan coba kembali.");
    }
    // The raw token is returned once; only its hash is persisted.
    return { order: safeOrder(inserted as OrderDb), waitingToken: token };
  });

const waitingInput = z.object({ orderId: z.string().uuid(), waitingToken: z.string().regex(/^[a-f0-9]{64}$/) });
export const getPaymentFlowStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => waitingInput.parse(data))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const tokenHash = await sha256(data.waitingToken);
    const { data: row, error } = await sb.from("orders")
      .select("id,created_at,name,service_name,pkg,payment_flow_status,total_amount,dp_percent,dp_amount,payment_note,access_code,confirmed_at,rejected_at,waiting_token_hash,is_legacy_order")
      .eq("id", data.orderId).maybeSingle();
    if (error || !row || row.is_legacy_order || row.waiting_token_hash !== tokenHash) {
      // Generic response prevents order enumeration and leaks no private order details.
      throw new Error("Pesanan tidak ditemukan atau akses tidak valid");
    }
    return { order: safeOrder(row as OrderDb), accessCode: row.payment_flow_status === "dikonfirmasi" ? row.access_code : null };
  });

const adminTransitionInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["menunggu_konfirmasi", "dikonfirmasi", "ditolak"]),
  rejectionReason: z.string().trim().max(1000).optional(),
});
export const adminTransitionPaymentFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => adminTransitionInput.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = await adminContext(context);
    const sb = await adminClient();
    const patch: Record<string, unknown> = { payment_flow_status: data.action };
    if (data.action === "dikonfirmasi") {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const bytes = new Uint8Array(10); crypto.getRandomValues(bytes);
      const accessCode = Array.from(bytes, (v) => alphabet[v % alphabet.length]).join("");
      patch["access_code"] = accessCode;
      patch["confirmed_at"] = new Date().toISOString();
      patch["confirmed_by"] = ctx.userId;
    } else if (data.action === "ditolak") {
      patch["rejected_at"] = new Date().toISOString();
      patch["rejected_by"] = ctx.userId;
      patch["rejection_reason"] = clean(data.rejectionReason);
    }
    const expected = data.action === "menunggu_konfirmasi" ? "menunggu_pembayaran" : "menunggu_konfirmasi";
    const { data: updated, error } = await sb.from("orders").update(patch)
      .eq("id", data.id).eq("payment_flow_status", expected).eq("is_legacy_order", false)
      .select("id,payment_flow_status,access_code").maybeSingle();
    if (error || !updated) throw new Error("Status pesanan berubah atau pembaruan gagal. Muat ulang daftar.");
    return { ok: true, accessCode: data.action === "dikonfirmasi" ? updated.access_code as string : null };
  });

const trackInput = z.object({ orderId: z.string().uuid(), accessCode: z.string().trim().regex(/^[A-HJ-NP-Z2-9]{8,10}$/) });
async function keyedHash(value: string): Promise<string> {
  const secret = process.env["ORDER_ACCESS_RATE_LIMIT_SECRET"];
  if (!secret || secret.length < 32) throw new Error("Layanan pelacakan belum dikonfigurasi");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(mac), (v) => v.toString(16).padStart(2, "0")).join("");
}
export const getTrackedOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackInput.parse(data))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const req = getRequest();
    const ip = req.headers.get("cf-connecting-ip");
    const orderScopeHash = await keyedHash("order:" + data.orderId);
    const ipScopeHash = ip ? await keyedHash("ip:" + ip.slice(0, 64)) : null;
    const { data: orderLocked, error: lockError } = await sb.rpc("is_order_access_locked", { p_scope: "order", p_subject_hash: orderScopeHash });
    if (lockError) throw new Error("Layanan pelacakan sementara tidak tersedia");
    if (orderLocked) throw new Error("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
    if (ipScopeHash) {
      const { data: ipLocked, error: ipLockError } = await sb.rpc("is_order_access_locked", { p_scope: "ip", p_subject_hash: ipScopeHash });
      if (ipLockError) throw new Error("Layanan pelacakan sementara tidak tersedia");
      if (ipLocked) throw new Error("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
    }
    const { data: row, error } = await sb.from("orders")
      .select("id,created_at,name,contact,service_name,pkg,status,payment_status,payment_method,payment_flow_status,total_amount,dp_percent,dp_amount,payment_note,access_code,confirmed_at,rejected_at,rejection_reason,is_legacy_order")
      .eq("id", data.orderId).maybeSingle();
    if (error) throw new Error("Layanan pelacakan sementara tidak tersedia");
    // Generic response for missing, legacy, or invalid credentials.
    if (!row || row.is_legacy_order || row.payment_flow_status !== "dikonfirmasi" || row.access_code !== data.accessCode) {
      await sb.rpc("record_order_access_failure", { p_scope: "order", p_subject_hash: orderScopeHash, p_order_id: data.orderId });
      if (ipScopeHash) await sb.rpc("record_order_access_failure", { p_scope: "ip", p_subject_hash: ipScopeHash, p_order_id: null });
      throw new Error("Nomor pesanan atau kode akses tidak valid");
    }
    await sb.rpc("reset_order_access_attempts", { p_order_subject_hash: orderScopeHash });
    return { order: {
      id: row.id, created_at: row.created_at, service_name: row.service_name, pkg: row.pkg,
      status: row.status, payment_status: row.payment_status, payment_method: row.payment_method,
      payment_flow_status: row.payment_flow_status, total_amount: row.total_amount,
      dp_percent: row.dp_percent, dp_amount: row.dp_amount, payment_note: row.payment_note,
      confirmed_at: row.confirmed_at,
    } };
  });
