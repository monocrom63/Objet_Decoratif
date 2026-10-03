import { Router, type IRouter } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, productsTable, scentsTable } from "@workspace/db";
import {
  GetCatalogResponse,
  InitializeCatalogResponse,
  ListAdminProductsResponse,
  CreateProductBody,
  CreateProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  ListAdminScentsResponse,
  CreateScentBody,
  CreateScentResponse,
  UpdateScentParams,
  UpdateScentBody,
  UpdateScentResponse,
  DeleteScentParams,
} from "@workspace/api-zod";
import { currentUser } from "./commerce";
import { enqueueCatalogImageCleanup } from "../lib/catalogImageCleanup";
import {
  removedProductImagePaths,
  replacedScentImagePaths,
} from "../lib/catalogImageCleanupPolicy";
import { initialProducts, initialScents } from "../lib/catalogDefaults";

const router: IRouter = Router();
async function admin(req: Parameters<typeof currentUser>[0]) {
  const user = await currentUser(req);
  return user?.role === "admin";
}
async function validScentIds(ids: string[]) {
  const scents = await db.select({ id: scentsTable.id }).from(scentsTable);
  const valid = new Set(scents.map((s) => s.id));
  return ids.every((id) => valid.has(id));
}

router.get("/catalog", async (_req, res): Promise<void> => {
  const [products, scents] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(
        and(eq(productsTable.active, true), eq(productsTable.published, true)),
      )
      .orderBy(asc(productsTable.sortOrder)),
    db
      .select()
      .from(scentsTable)
      .where(and(eq(scentsTable.active, true), eq(scentsTable.published, true)))
      .orderBy(asc(scentsTable.sortOrder)),
  ]);
  res.json(GetCatalogResponse.parse({ products, scents }));
});
router.post("/admin/catalog/initialize", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const catalog = await db.transaction(async (tx) => {
    // Serializes initializers and catalog writes; the check and inserts are atomic.
    await tx.execute(
      sql`LOCK TABLE catalog_products, catalog_scents IN SHARE ROW EXCLUSIVE MODE`,
    );
    const products = await tx
      .select({ id: productsTable.id })
      .from(productsTable)
      .limit(1);
    const scents = await tx
      .select({ id: scentsTable.id })
      .from(scentsTable)
      .limit(1);
    if (products.length || scents.length) return null;
    const createdScents = await tx
      .insert(scentsTable)
      .values(initialScents)
      .returning();
    const createdProducts = await tx
      .insert(productsTable)
      .values(initialProducts)
      .returning();
    return InitializeCatalogResponse.parse({
      products: createdProducts,
      scents: createdScents,
    });
  });
  if (!catalog) {
    res
      .status(409)
      .json({ error: "Catalog is not empty; no records were changed." });
    return;
  }
  req.log.info(
    { products: catalog.products.length, scents: catalog.scents.length },
    "Initialized empty store catalog",
  );
  res.status(201).json(catalog);
});
router.get("/admin/catalog/products", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  res.json(
    ListAdminProductsResponse.parse(
      await db
        .select()
        .from(productsTable)
        .orderBy(asc(productsTable.sortOrder)),
    ),
  );
});
router.post("/admin/catalog/products", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const body = CreateProductBody.safeParse(req.body);
  if (!body.success || !(await validScentIds(body.data.scentIds))) {
    res.status(400).json({ error: "Invalid product or scent IDs" });
    return;
  }
  const [product] = await db
    .insert(productsTable)
    .values(body.data)
    .returning();
  res.status(201).json(CreateProductResponse.parse(product));
});
router.patch("/admin/catalog/products/:id", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const params = UpdateProductParams.safeParse(req.params),
    body = UpdateProductBody.safeParse(req.body);
  if (
    !params.success ||
    !body.success ||
    (body.data.scentIds && !(await validScentIds(body.data.scentIds)))
  ) {
    res.status(400).json({ error: "Invalid product update" });
    return;
  }
  const [existing] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .limit(1);
  const [product] = await db
    .update(productsTable)
    .set(body.data)
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  enqueueCatalogImageCleanup(
    removedProductImagePaths(existing?.imagePaths ?? [], product.imagePaths),
  );
  res.json(UpdateProductResponse.parse(product));
});
router.delete(
  "/admin/catalog/products/:id",
  async (req, res): Promise<void> => {
    if (!(await admin(req))) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [product] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, params.data.id))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    enqueueCatalogImageCleanup(product.imagePaths);
    res.sendStatus(204);
  },
);
router.get("/admin/catalog/scents", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  res.json(
    ListAdminScentsResponse.parse(
      await db.select().from(scentsTable).orderBy(asc(scentsTable.sortOrder)),
    ),
  );
});
router.post("/admin/catalog/scents", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const body = CreateScentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [scent] = await db.insert(scentsTable).values(body.data).returning();
  res.status(201).json(CreateScentResponse.parse(scent));
});
router.patch("/admin/catalog/scents/:id", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const params = UpdateScentParams.safeParse(req.params),
    body = UpdateScentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid scent update" });
    return;
  }
  const [existing] = await db
    .select()
    .from(scentsTable)
    .where(eq(scentsTable.id, params.data.id))
    .limit(1);
  const [scent] = await db
    .update(scentsTable)
    .set(body.data)
    .where(eq(scentsTable.id, params.data.id))
    .returning();
  if (!scent) {
    res.status(404).json({ error: "Scent not found" });
    return;
  }
  enqueueCatalogImageCleanup(
    replacedScentImagePaths(existing?.imagePath, scent.imagePath),
  );
  res.json(UpdateScentResponse.parse(scent));
});
router.delete("/admin/catalog/scents/:id", async (req, res): Promise<void> => {
  if (!(await admin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const params = DeleteScentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [scent] = await db
    .delete(scentsTable)
    .where(eq(scentsTable.id, params.data.id))
    .returning();
  if (!scent) {
    res.status(404).json({ error: "Scent not found" });
    return;
  }
  enqueueCatalogImageCleanup(scent.imagePath ? [scent.imagePath] : []);
  res.sendStatus(204);
});
export default router;
