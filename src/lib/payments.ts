import { z } from "zod";

export const moneySchema = z.number().int().min(0).max(2_000_000_000);
export const paymentSettingsSchema = z.object({
  depositPercent: z.number().int().min(0).max(100),
  depositRequired: z.boolean(),
  bankEnabled: z.boolean(), qrisEnabled: z.boolean(), cashEnabled: z.boolean(),
  instructions: z.string().trim().max(3000), bankAccount: z.string().trim().max(1000),
  confirmationContact: z.string().trim().max(300), terms: z.string().trim().max(3000),
});
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export const defaultPaymentSettings: PaymentSettings = {
  depositPercent: 0, depositRequired: false, bankEnabled: true, qrisEnabled: false, cashEnabled: true,
  instructions: "Pembayaran dilakukan setelah harga dikonfirmasi admin.", bankAccount: "",
  confirmationContact: "081233097078", terms: "Pelunasan dan penyerahan hasil disepakati bersama admin.",
};
export const workStatuses = ["baru", "menunggu_dp", "diproses", "revisi", "menunggu_pelunasan", "selesai", "batal"] as const;
export const methodLabels = { bank: "Transfer Bank", qris: "QRIS", cash: "Cash" } as const;
export type PaymentMethod = keyof typeof methodLabels;
export function enabledMethods(s: PaymentSettings, qrisReady = false): PaymentMethod[] {
  return ([s.bankEnabled && "bank", s.qrisEnabled && qrisReady && "qris", s.cashEnabled && "cash"] as const)
    .filter((m): m is PaymentMethod => Boolean(m));
}
export function depositAmount(price: number, percent: number) {
  moneySchema.parse(price); z.number().int().min(0).max(100).parse(percent);
  return Number((BigInt(price) * BigInt(percent) + 50n) / 100n);
}
export type PaymentRecord = { amount: number; status: string };
export function confirmedTotal(rows: PaymentRecord[]) {
  return rows.filter((r) => r.status === "confirmed").reduce((sum, r) => sum + r.amount, 0);
}
export function balance(price: number | null, rows: PaymentRecord[]) {
  return price === null ? null : price - confirmedTotal(rows);
}
export function paymentStatus(price: number | null, percent: number, rows: PaymentRecord[]) {
  const received = confirmedTotal(rows);
  if (price === null) return "Menunggu konfirmasi harga";
  if (received > price) return "Kelebihan bayar";
  if (received === price) return "Lunas";
  if (received > 0 && received < depositAmount(price, percent)) return "DP sebagian";
  if (received > 0 && received >= depositAmount(price, percent) && percent > 0) return "DP terkonfirmasi · Belum lunas";
  if (received > 0) return "Belum lunas";
  if (rows.some((r) => r.status === "pending")) return "Menunggu verifikasi";
  if (rows.some((r) => r.status === "failed")) return "Gagal";
  if (rows.some((r) => r.status === "cancelled")) return "Dibatalkan";
  return "Belum bayar";
}