import { describe, expect, it } from "vitest";
import { orderSchema, buildOrderMessage } from "@/lib/order";
const base = { name: "Budi", contact: "081234567890", service: "x", pkg: "Basic", payment_method: "transfer" as const, description: "Poster seminar kampus" };
describe("order form", () => {
  it("accepts a valid Indonesian WhatsApp number", () => expect(orderSchema.safeParse(base).success).toBe(true));
  it("rejects an invalid contact", () => expect(orderSchema.safeParse({ ...base, contact: "123" }).success).toBe(false));
  it("omits empty optional fields from the WhatsApp message", () => {
    const m = buildOrderMessage(orderSchema.parse({ ...base, notes: "" }), "Poster", "Brand");
    expect(m).not.toContain("Catatan");
    expect(m).toContain("Paket: Basic");
  });
});
