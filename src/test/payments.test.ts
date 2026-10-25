import { describe, it, expect } from "vitest";
import { paymentSettingsSchema, defaultPaymentSettings, depositAmount, confirmedTotal, balance, enabledMethods } from "@/lib/payments";
describe("payment rules", () => {
  it("accepts deposit percentages 0 and 100", () => {
    expect(paymentSettingsSchema.parse({ ...defaultPaymentSettings, depositPercent: 0 }).depositPercent).toBe(0);
    expect(paymentSettingsSchema.parse({ ...defaultPaymentSettings, depositPercent: 100 }).depositPercent).toBe(100);
  });
  it("rejects percentages outside 0–100", () => {
    expect(paymentSettingsSchema.safeParse({ ...defaultPaymentSettings, depositPercent: -1 }).success).toBe(false);
    expect(paymentSettingsSchema.safeParse({ ...defaultPaymentSettings, depositPercent: 101 }).success).toBe(false);
  });
  it("rounds deposit to integer Rupiah", () => expect(depositAmount(10001, 50)).toBe(5001));
  it("excludes pending, failed, expired and cancelled receipts", () => expect(confirmedTotal([
    { amount: 100, status: "confirmed" }, ...["pending", "failed", "expired", "cancelled"].map(status => ({ amount: 999, status })),
  ])).toBe(100));
  it("subtracts all confirmed installments from final price", () => expect(balance(100000, [{ amount: 30000, status: "confirmed" }, { amount: 20000, status: "confirmed" }])).toBe(50000));
  it("does not invent an unconfirmed final price", () => expect(balance(null, [])).toBeNull());
  it("only offers enabled and configured methods", () => expect(enabledMethods({ ...defaultPaymentSettings, bankEnabled: false, qrisEnabled: true }, false)).toEqual(["cash"]));
});