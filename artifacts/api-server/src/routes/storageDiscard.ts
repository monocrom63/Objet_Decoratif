import { Router, type IRouter, type Request } from "express";

export interface DiscardManagedUploadDependencies {
  currentUser: (req: Request) => Promise<{ role: string } | null>;
  isManagedUploadPath: (objectPath: string) => boolean;
  isCatalogImageReferenced: (objectPath: string) => Promise<boolean>;
  deleteManagedUpload: (objectPath: string) => Promise<unknown>;
}

export async function discardManagedUpload(
  objectPath: unknown,
  dependencies: DiscardManagedUploadDependencies,
): Promise<'discarded' | 'invalid' | 'referenced'> {
  if (
    typeof objectPath !== 'string' ||
    !dependencies.isManagedUploadPath(objectPath)
  ) {
    return 'invalid';
  }
  if (await dependencies.isCatalogImageReferenced(objectPath)) {
    return 'referenced';
  }
  await dependencies.deleteManagedUpload(objectPath);
  return 'discarded';
}

export function createDiscardUploadRouter(
  dependencies: DiscardManagedUploadDependencies,
): IRouter {
  const router = Router();
  router.post("/storage/uploads/discard", async (req, res): Promise<void> => {
    const user = await dependencies.currentUser(req);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }

    try {
      const result = await discardManagedUpload(req.body?.objectPath, dependencies);
      if (result === "invalid") {
        res.status(400).json({ error: "Invalid managed upload path" });
        return;
      }
      if (result === "referenced") {
        res.status(409).json({ error: "Upload is referenced by the catalog" });
        return;
      }
      res.sendStatus(204);
    } catch (error) {
      req.log.error({ err: error }, "Failed to discard upload");
      res.status(500).json({ error: "Failed to discard upload" });
    }
  });
  return router;
}