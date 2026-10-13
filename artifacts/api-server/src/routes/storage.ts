import { Readable } from 'stream';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
  CleanupUnusedImagesResponse,
} from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';

import { ObjectPermission } from '../lib/objectAcl';
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';
import {
  cleanupAbandonedCatalogUploads,
  isCatalogImageReferenced,
} from '../lib/catalogImageCleanup';
import { currentUser } from './commerce';
import { createDiscardUploadRouter } from './storageDiscard';
import { catalogUploadExtension } from '../lib/catalogMediaPolicy.ts';

const objectStorageService = new ObjectStorageService();

type StorageService = Pick<
  ObjectStorageService,
  | 'deleteManagedUpload'
  | 'downloadObject'
  | 'getObjectEntityFile'
  | 'getObjectEntityUploadURL'
  | 'isManagedUploadPath'
  | 'normalizeObjectEntityPath'
  | 'searchPublicObject'
>;

export interface StorageRouterDependencies {
  currentUser: typeof currentUser;
  objectStorageService: StorageService;
  isCatalogImageReferenced: typeof isCatalogImageReferenced;
  cleanupAbandonedCatalogUploads: typeof cleanupAbandonedCatalogUploads;
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
export function createStorageRouter(
  dependencies: StorageRouterDependencies = {
    currentUser,
    objectStorageService,
    isCatalogImageReferenced,
    cleanupAbandonedCatalogUploads,
  },
): IRouter {
const router: IRouter = Router();

router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    const user = await dependencies.currentUser(req);
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
      const extension = catalogUploadExtension(contentType, size);
      if (extension === null) {
        res.status(400).json({ error: 'Images up to 10 MB or MP4/WebM videos up to 100 MB are accepted' });
        return;
      }

      const uploadURL =
        await dependencies.objectStorageService.getObjectEntityUploadURL(extension);
      const objectPath =
        dependencies.objectStorageService.normalizeObjectEntityPath(uploadURL);

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

router.use(createDiscardUploadRouter({
  currentUser: dependencies.currentUser,
  isManagedUploadPath: (path) =>
    dependencies.objectStorageService.isManagedUploadPath(path),
  isCatalogImageReferenced: dependencies.isCatalogImageReferenced,
  deleteManagedUpload: (path) =>
    dependencies.objectStorageService.deleteManagedUpload(path),
}));

router.post('/admin/storage/cleanup-unused-images', async (req: Request, res: Response): Promise<void> => {
  const user = await dependencies.currentUser(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  try {
    const result = await dependencies.cleanupAbandonedCatalogUploads();
    res.json(CleanupUnusedImagesResponse.parse(result));
  } catch (error) {
    req.log.error({ err: error }, 'Catalog upload cleanup failed');
    res.status(500).json({ error: 'Catalog upload cleanup failed' });
  }
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
      const file =
        await dependencies.objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response =
        await dependencies.objectStorageService.downloadObject(file, 3600, req.get('range'));

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
      await dependencies.objectStorageService.getObjectEntityFile(objectPath);

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

    const response =
      await dependencies.objectStorageService.downloadObject(objectFile, 3600, req.get('range'));

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

return router;
}

export default createStorageRouter();
