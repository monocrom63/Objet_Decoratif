import { ReplitConnectors } from "@replit/connectors-sdk";

export type OrderConfirmationEmailInput = {
  orderNumber: string;
  email: string;
  customerName: string;
  address: string;
  language: "EN" | "DE";
  subtotal: number;
  shipping: number;
  total: number;
  items: Array<{
    name: string;
    scent: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type OrderConfirmationEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export class OrderConfirmationEmailError extends Error {
  readonly providerStatus: number;

  constructor(providerStatus: number) {
    super("The order confirmation email provider rejected the request");
    this.name = "OrderConfirmationEmailError";
    this.providerStatus = providerStatus;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

function formatPrice(value: number, language: "EN" | "DE"): string {
  return new Intl.NumberFormat(language === "DE" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function buildOrderConfirmationEmail(
  order: OrderConfirmationEmailInput,
): OrderConfirmationEmailContent {
  const isGerman = order.language === "DE";
  const subject = isGerman
    ? `Bestätigung deiner Bestellung ${order.orderNumber}`
    : `Order confirmation ${order.orderNumber}`;
  const greeting = isGerman ? `Hallo ${order.customerName},` : `Hello ${order.customerName},`;
  const intro = isGerman
    ? `Wir haben deine verbindliche Bestellung ${order.orderNumber} erhalten.`
    : `We have received your binding order ${order.orderNumber}.`;
  const paymentNote = isGerman
    ? "Es wurde noch keine Zahlung eingezogen. Diese E-Mail bestätigt den Eingang deiner Bestellung, nicht den Zahlungseingang."
    : "No payment has been charged. This email confirms receipt of your order, not receipt of payment.";
  const addressLabel = isGerman ? "Lieferadresse" : "Delivery address";
  const orderLabel = isGerman ? "Deine Bestellung" : "Your order";
  const subtotalLabel = isGerman ? "Zwischensumme" : "Subtotal";
  const shippingLabel = isGerman ? "Versand" : "Shipping";
  const totalLabel = isGerman ? "Gesamt" : "Total";
  const closing = isGerman ? "Vielen Dank,\nObjet Décoratif" : "Thank you,\nObjet Décoratif";

  const itemLines = order.items.map((item) => {
    const itemDescription = `${item.name} — ${item.scent} × ${item.quantity}`;
    return `${itemDescription}: ${formatPrice(item.lineTotal, order.language)}`;
  });
  const totals = [
    `${subtotalLabel}: ${formatPrice(order.subtotal, order.language)}`,
    `${shippingLabel}: ${formatPrice(order.shipping, order.language)}`,
    `${totalLabel}: ${formatPrice(order.total, order.language)}`,
  ];
  const text = [
    greeting,
    "",
    intro,
    "",
    paymentNote,
    "",
    orderLabel,
    ...itemLines,
    "",
    ...totals,
    "",
    `${addressLabel}:`,
    order.address,
    "",
    closing,
  ].join("\n");

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e0d7">
        <strong>${escapeHtml(item.name)}</strong><br>
        <span style="color:#777">${escapeHtml(item.scent)} · ${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e0d7;text-align:right;white-space:nowrap">
        ${escapeHtml(formatPrice(item.lineTotal, order.language))}
      </td>
    </tr>`).join("");

  const html = `<!doctype html>
<html lang="${isGerman ? "de" : "en"}">
  <body style="margin:0;background:#f6f3ec;color:#211f1b;font-family:Arial,sans-serif">
    <main style="max-width:600px;margin:0 auto;padding:36px 24px">
      <p style="font-size:13px;letter-spacing:.18em;text-transform:uppercase">Objet Décoratif</p>
      <h1 style="font-size:26px;font-weight:500">${isGerman ? "Bestellung eingegangen" : "Order received"}</h1>
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(intro)}</p>
      <p style="padding:16px;background:#eee8d6;border-radius:8px">${escapeHtml(paymentNote)}</p>
      <h2 style="margin-top:30px;font-size:17px;font-weight:500">${escapeHtml(orderLabel)}</h2>
      <p style="color:#777">${escapeHtml(order.orderNumber)}</p>
      <table style="width:100%;border-collapse:collapse">${itemRows}</table>
      <table style="width:100%;margin-top:16px;border-collapse:collapse">
        <tr><td style="padding:5px 0">${escapeHtml(subtotalLabel)}</td><td style="text-align:right">${escapeHtml(formatPrice(order.subtotal, order.language))}</td></tr>
        <tr><td style="padding:5px 0">${escapeHtml(shippingLabel)}</td><td style="text-align:right">${escapeHtml(formatPrice(order.shipping, order.language))}</td></tr>
        <tr><td style="padding:12px 0;border-top:1px solid #c9c2b5"><strong>${escapeHtml(totalLabel)}</strong></td><td style="padding:12px 0;border-top:1px solid #c9c2b5;text-align:right"><strong>${escapeHtml(formatPrice(order.total, order.language))}</strong></td></tr>
      </table>
      <h2 style="margin-top:30px;font-size:17px;font-weight:500">${escapeHtml(addressLabel)}</h2>
      <p>${escapeHtml(order.customerName)}<br>${escapeHtml(order.address)}</p>
      <p style="margin-top:32px;white-space:pre-line">${escapeHtml(closing)}</p>
    </main>
  </body>
</html>`;

  return { subject, html, text };
}

export async function sendOrderConfirmationEmail(
  order: OrderConfirmationEmailInput,
  connectors = new ReplitConnectors(),
): Promise<void> {
  const content = buildOrderConfirmationEmail(order);
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `guest-order-${order.orderNumber}`,
    },
    body: JSON.stringify({
      from: "Objet Décoratif <info@objetdecorativ.art>",
      reply_to: "info@objetdecorativ.art",
      to: order.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  if (!response.ok) throw new OrderConfirmationEmailError(response.status);
}
