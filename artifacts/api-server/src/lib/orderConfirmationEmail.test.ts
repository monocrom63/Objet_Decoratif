import assert from "node:assert/strict";
import test from "node:test";
import type { ReplitConnectors } from "@replit/connectors-sdk";
import {
  buildOrderConfirmationEmail,
  sendOrderConfirmationEmail,
  type OrderConfirmationEmailInput,
} from "./orderConfirmationEmail.ts";

const sampleOrder: OrderConfirmationEmailInput = {
  orderNumber: "OD-TEST-1234",
  email: "guest@example.com",
  customerName: "Avery <Admin>",
  address: "Example Street 1, 10115 Berlin, Germany",
  language: "EN",
  subtotal: 65,
  shipping: 8,
  total: 73,
  items: [{
    name: "Barrique",
    scent: "Thé",
    quantity: 1,
    unitPrice: 65,
    lineTotal: 65,
  }],
};

test("builds a localized order confirmation with escaped HTML and an unpaid notice", () => {
  const english = buildOrderConfirmationEmail(sampleOrder);
  assert.equal(english.subject, "Order confirmation OD-TEST-1234");
  assert.match(english.text, /No payment has been charged/);
  assert.match(english.html, /Avery &lt;Admin&gt;/);
  assert.doesNotMatch(english.html, /<Admin>/);

  const german = buildOrderConfirmationEmail({ ...sampleOrder, language: "DE" });
  assert.equal(german.subject, "Bestätigung deiner Bestellung OD-TEST-1234");
  assert.match(german.text, /Es wurde noch keine Zahlung eingezogen/);
  assert.match(german.html, /lang="de"/);
});

test("sends only the order confirmation through the connected Resend proxy", async () => {
  let request: { connector: string; path: string; options?: { method?: string; headers?: Record<string, string>; body?: unknown } } | undefined;
  const connectors = {
    proxy: async (connector: string, path: string, options?: { method?: string; headers?: Record<string, string>; body?: unknown }) => {
      request = { connector, path, options };
      return new Response(null, { status: 200 });
    },
  } as unknown as ReplitConnectors;

  await sendOrderConfirmationEmail(sampleOrder, connectors);

  assert.equal(request?.connector, "resend");
  assert.equal(request?.path, "/emails");
  assert.equal(request?.options?.method, "POST");
  assert.equal(request?.options?.headers?.["Idempotency-Key"], "guest-order-OD-TEST-1234");
  const sent = JSON.parse(String(request?.options?.body));
  assert.equal(sent.to, sampleOrder.email);
  assert.equal(sent.from, "Objet Décoratif <info@objetdecorativ.art>");
  assert.match(sent.text, /OD-TEST-1234/);
});
