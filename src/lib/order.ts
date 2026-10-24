import { z } from "zod";

export const orderSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  contact: z
    .string()
    .trim()
    .refine((v) => /^(\+?62|0)8\d{7,12}$/.test(v.replace(/[\s-]/g, "")) || /^\S+@\S+\.\S+$/.test(v), "Masukkan nomor WhatsApp (08xx) atau email yang valid"),
  service: z.string().min(1, "Pilih layanan"),
  pkg: z.string().min(1, "Pilih paket"),
  quantity: z.string().trim().max(100).optional(),
  description: z.string().trim().min(10, "Jelaskan pesanan minimal 10 karakter").max(2000),
  reference: z.string().trim().max(500).optional(),
  deadline: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type Order = z.infer<typeof orderSchema>;

export function buildOrderMessage(o: Order, serviceName: string, brand: string) {
  const lines = [
    `Halo ${brand}, saya ingin memesan:`,
    ``,
    `Nama: ${o.name}`,
    `Kontak: ${o.contact}`,
    `Layanan: ${serviceName}`,
    `Paket: ${o.pkg}`,
    o.quantity ? `Jumlah/kebutuhan: ${o.quantity}` : null,
    `Deskripsi: ${o.description}`,
    o.reference ? `Referensi: ${o.reference}` : null,
    o.deadline ? `Deadline: ${o.deadline}` : null,
    o.notes ? `Catatan: ${o.notes}` : null,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
