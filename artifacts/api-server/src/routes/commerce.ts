import { Router, type IRouter, type Request } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { randomUUID } from "node:crypto";
import { db, ordersTable, usersTable, productsTable, type StoreOrder } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetMeResponse,
  ListAdminOrdersResponse,
  ListAdminUsersResponse,
  ListMyOrdersResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { configuredAdminEmails, isVerifiedConfiguredAdmin, initialStoreRole } from "../lib/storeAdminAccess.ts";
import { createGuestOrderLimiter } from "../lib/guestOrderLimit.ts";

const router: IRouter = Router();
const allowGuestOrder = createGuestOrderLimiter();
export async function currentUser(req: Request) {
  const auth = getAuth(req);
  if (!auth.userId) return null;
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, auth.userId)).limit(1);
  const allowedEmails = configuredAdminEmails(process.env.SHOP_ADMIN_EMAILS);
  if (existing[0] && (existing[0].role === "admin" || allowedEmails.size === 0)) return existing[0];

  const clerkUser = await clerkClient.users.getUser(auth.userId);
  const configuredAdmin = isVerifiedConfiguredAdmin(clerkUser.primaryEmailAddress, allowedEmails);
  if (existing[0]) {
    if (!configuredAdmin) return existing[0];
    const [promoted] = await db.update(usersTable).set({ role: "admin" })
      .where(eq(usersTable.clerkUserId, auth.userId)).returning();
    if (!promoted) throw new Error("Could not grant configured administrator access");
    return promoted;
  }
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Authenticated user has no email address");
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
  const [created] = await db.insert(usersTable).values({
    clerkUserId: auth.userId,
    email,
    name,
    role: initialStoreRole(admins.length > 0, configuredAdmin),
  }).onConflictDoNothing({ target: usersTable.clerkUserId }).returning();
  if (created) return created;

  const [concurrentlyCreated] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, auth.userId))
    .limit(1);
  if (!concurrentlyCreated) throw new Error("Could not initialize authenticated user");
  if (configuredAdmin && concurrentlyCreated.role !== "admin") {
    const [promoted] = await db.update(usersTable).set({ role: "admin" })
      .where(eq(usersTable.clerkUserId, auth.userId)).returning();
    if (!promoted) throw new Error("Could not grant configured administrator access");
    return promoted;
  }
  return concurrentlyCreated;
}

function orderResponse(order: StoreOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    isGuest: order.userId === null,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    paymentMethod: order.cardLastFour ? `${order.paymentMethod} •••• ${order.cardLastFour}` : order.paymentMethod,
    status: order.status as "new" | "processing" | "shipped" | "completed" | "cancelled",
    subtotal: order.subtotalCents / 100,
    shipping: order.shippingCents / 100,
    total: order.totalCents / 100,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item, index) => ({ ...item, id: index + 1 })),
  };
}

router.get("/me", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  res.json(GetMeResponse.parse({ id: user.id, email: user.email, name: user.name, role: user.role }));
});

router.get("/orders", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.id)).orderBy(desc(ordersTable.createdAt));
  res.json(ListMyOrdersResponse.parse(orders.map(orderResponse)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = parsed.data.guest ? null : await currentUser(req);
  if (!parsed.data.guest && !user) {
    res.status(401).json({ error: "Sign in or choose guest checkout" }); return;
  }
  if ([parsed.data.firstName, parsed.data.lastName, parsed.data.address, parsed.data.postalCode, parsed.data.city, parsed.data.country].some((field) => !field.trim())) {
    res.status(400).json({ error: "Complete the customer and delivery details" }); return;
  }
  if (parsed.data.items.some((item) => item.quantity > 100)) {
    res.status(400).json({ error: "A maximum of 100 units per item can be ordered online" }); return;
  }
  const catalogProducts = await db.select().from(productsTable);
  if (parsed.data.items.some((item) => !catalogProducts.some((product) => product.id === item.productId && product.active && product.published))) {
    res.status(400).json({ error: "One or more products are no longer available" }); return;
  }
  const items = parsed.data.items.map((item) => {
    const product = catalogProducts.find((entry) => entry.id === item.productId && entry.active && entry.published);
    if (!product) throw new Error(`Unknown or unavailable product: ${item.productId}`);
    return { productId: item.productId, name: product.name, scent: item.scent, quantity: item.quantity, unitPrice: product.priceCents / 100, lineTotal: product.priceCents * item.quantity / 100 };
  });
  if (parsed.data.guest && !allowGuestOrder(req.ip ?? "unknown", parsed.data.email)) {
    res.setHeader("Retry-After", "900");
    res.status(429).json({ error: "Too many guest orders. Please try again later." });
    return;
  }
  const subtotalCents = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100);
  const shippingCents = 800;
  const [order] = await db.insert(ordersTable).values({
    orderNumber: `OD-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    userId: user?.id ?? null,
    customerEmail: parsed.data.email,
    customerName: `${parsed.data.firstName} ${parsed.data.lastName}`,
    phone: parsed.data.phone,
    address: [parsed.data.company, parsed.data.address, parsed.data.apartment, `${parsed.data.postalCode} ${parsed.data.city}`, parsed.data.country].filter(Boolean).join(", "),
    paymentMethod: parsed.data.paymentMethod,
    cardLastFour: parsed.data.cardLastFour,
    status: "new",
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    items,
  }).returning();
  res.status(201).json(CreateOrderResponse.parse(orderResponse(order)));
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(ListAdminOrdersResponse.parse(orders.map(orderResponse)));
});

router.patch("/admin/orders/:id", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  const params = UpdateOrderStatusParams.safeParse(req.params);
  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid status update" }); return; }
  const [order] = await db.update(ordersTable).set({ status: body.data.status }).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(UpdateOrderStatusResponse.parse(orderResponse(order)));
});

router.get("/admin/users", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  const [users, orders] = await Promise.all([
    db.select().from(usersTable).orderBy(desc(usersTable.createdAt)),
    db.select().from(ordersTable),
  ]);
  res.json(ListAdminUsersResponse.parse(users.map((entry) => {
    const ownOrders = orders.filter((order) => order.userId === entry.id);
    return {
      id: entry.id,
      email: entry.email,
      name: entry.name,
      role: entry.role,
      orderCount: ownOrders.length,
      totalSpent: ownOrders.reduce((sum, order) => sum + order.totalCents, 0) / 100,
      createdAt: entry.createdAt.toISOString(),
    };
  })));
});

export default router;