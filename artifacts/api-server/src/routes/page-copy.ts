import { Router, type IRouter, type Request } from "express";
import { sql } from "drizzle-orm";
import { db, pageCopyTable } from "@workspace/db";
import {
  GetAdminPageCopyResponse,
  GetPageCopyResponse,
  UpdateAdminPageCopyBody,
  UpdateAdminPageCopyResponse,
} from "@workspace/api-zod";
import { currentUser } from "./commerce";

const router: IRouter = Router();

async function isAdmin(req: Request): Promise<boolean> {
  const user = await currentUser(req);
  return user?.role === "admin";
}

router.get("/page-copy", async (_req, res): Promise<void> => {
  const items = await db.select().from(pageCopyTable);
  res.json(GetPageCopyResponse.parse(items));
});

router.get("/admin/page-copy", async (req, res): Promise<void> => {
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const items = await db.select().from(pageCopyTable);
  res.json(GetAdminPageCopyResponse.parse(items));
});

router.patch("/admin/page-copy", async (req, res): Promise<void> => {
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const body = UpdateAdminPageCopyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const seen = new Set<string>();
  for (const item of body.data.items) {
    if (seen.has(item.key)) {
      res.status(400).json({ error: "Duplicate page copy key" });
      return;
    }
    seen.add(item.key);
  }

  if (body.data.items.length === 0) {
    res.json([]);
    return;
  }

  const saved = await db
    .insert(pageCopyTable)
    .values(body.data.items)
    .onConflictDoUpdate({
      target: pageCopyTable.key,
      set: {
        english: sql`excluded.english`,
        german: sql`excluded.german`,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.json(UpdateAdminPageCopyResponse.parse(saved));
});

export default router;
