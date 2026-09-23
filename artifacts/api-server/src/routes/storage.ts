import { Readable } from 'stream';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
  DiscardUploadBody,
  CleanupUnusedImagesResponse,
} from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';

import { ObjectPermission } from '../lib/objectAcl';
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';
import { currentUser } from './commerce';
import { db, productsTable, scentsTable } from '@workspace/db';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const ABANDONED_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;

async function referencedCatalogImages(): Promise<Set<string>> {
  const [products, scents] = await Promise.all([
    db.select({ imagePaths: productsTable.imagePaths }).from(productsTable),
    db.select({ imagePath: scentsTable.imagePath }).from(scentsTable),
  ]);
  return new Set([
    ...products.flatMap((product) => product.imagePaths),
    ...scents.flatMap((scent) => scent.imagePath ? [scent.imagePath] : []),
  ]);
}

function hasAuthenticatedSession(
  req: Request,
): req is Request & { isAuthenticated: () => boolean } {
  if (
    !('isAuthenticated' in req) ||
    typeof req.isAuthenticated !== 'function'
  ) {
    return false;
  }

  return req.isAuthenticated();
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 * Requires auth middleware so public callers cannot mint write-capable URLs.
 */
router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    const user = await currentUser(req);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: 'Admin only' });

      return;
    }

    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;
      if (!/^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(contentType) || size > 10 * 1024 * 1024) {
        res.status(400).json({ error: 'Only images up to 10 MB are accepted' });
        return;
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

router.post('/storage/uploads/discard', async (req: Request, res: Response): Promise<void> => {
  const user = await currentUser(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const body = DiscardUploadBody.safeParse(req.body);
  if (!body.success || !objectStorageService.isManagedUploadPath(body.data.objectPath)) {
    res.status(400).json({ error: 'Invalid managed upload path' });
    return;
  }
  const referenced = await referencedCatalogImages();
  if (referenced.has(body.data.objectPath)) {
    res.status(409).json({ error: 'Upload is referenced by the catalog' });
    return;
  }
  await objectStorageService.deleteManagedUpload(body.data.objectPath);
  res.sendStatus(204);
});

router.post('/admin/storage/cleanup-unused-images', async (req: Request, res: Response): Promise<void> => {
  const user = await currentUser(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const [uploads, referenced] = await Promise.all([
    objectStorageService.listManagedUploads(),
    referencedCatalogImages(),
  ]);
  const cutoff = Date.now() - ABANDONED_UPLOAD_AGE_MS;
  const candidates = uploads.filter(
    (upload) => upload.createdAt.getTime() < cutoff && !referenced.has(upload.objectPath),
  );
  const deleted = (await Promise.all(
    candidates.map((upload) => objectStorageService.deleteManagedUpload(upload.objectPath)),
  )).filter(Boolean).length;
  res.json(CleanupUnusedImagesResponse.parse({
    scanned: uploads.length,
    deleted,
    retained: uploads.length - deleted,
  }));
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;
