import type { AdminUser, Order } from "@workspace/api-client-react";

// Presentation-only examples. These are never sent to the API or included in live metrics.
export const demoUsers: AdminUser[] = [
  {
    id: -1,
    name: "Demo-Kundin 01",
    email: "kunde01@example.com",
    role: "customer",
    orderCount: 2,
    totalSpent: 358,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: -2,
    name: "Demo-Kunde 02",
    email: "kunde02@example.com",
    role: "customer",
    orderCount: 2,
    totalSpent: 446,
    createdAt: "2026-09-03T10:00:00Z",
  },
  {
    id: -3,
    name: "Demo-Kundin 03",
    email: "kunde03@example.com",
    role: "customer",
    orderCount: 2,
    totalSpent: 402,
    createdAt: "2026-09-05T10:00:00Z",
  },
];

const examples: Array<{
  number: string;
  customer: (typeof demoUsers)[number];
  product: string;
  amount: number;
  status: Order["status"];
  day: string;
}> = [
  {
    number: "DEMO-001",
    customer: demoUsers[0],
    product: "Milano",
    amount: 179,
    status: "processing",
    day: "2026-09-06",
  },
  {
    number: "DEMO-002",
    customer: demoUsers[1],
    product: "Paris",
    amount: 218,
    status: "shipped",
    day: "2026-09-08",
  },
  {
    number: "DEMO-003",
    customer: demoUsers[2],
    product: "Milano",
    amount: 179,
    status: "completed",
    day: "2026-09-10",
  },
  {
    number: "DEMO-004",
    customer: demoUsers[0],
    product: "Milano",
    amount: 179,
    status: "completed",
    day: "2026-09-12",
  },
  {
    number: "DEMO-005",
    customer: demoUsers[1],
    product: "Paris",
    amount: 228,
    status: "processing",
    day: "2026-09-14",
  },
  {
    number: "DEMO-006",
    customer: demoUsers[2],
    product: "Paris",
    amount: 223,
    status: "shipped",
    day: "2026-09-16",
  },
];

export const demoOrders: Order[] = examples.map((example, index) => ({
  id: -(index + 1),
  orderNumber: example.number,
  customerEmail: example.customer.email,
  customerName: example.customer.name ?? "",
  phone: "Keine echte Telefonnummer",
  address: "Demoadresse – keine Lieferung",
  paymentMethod: "Demo – keine Zahlung",
  status: example.status,
  subtotal: example.amount,
  shipping: 0,
  total: example.amount,
  createdAt: `${example.day}T10:00:00Z`,
  items: [
    {
      id: 1,
      productId: "demo-product",
      name: example.product,
      scent: "Beispielduft",
      quantity: 1,
      unitPrice: example.amount,
      lineTotal: example.amount,
    },
  ],
}));
