import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getCatalogUploadCleanupHealth } from "../lib/catalogImageCleanupHealth";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const catalogUploadCleanup = getCatalogUploadCleanupHealth();
  const data = HealthCheckResponse.parse({
    status: catalogUploadCleanup.status,
    catalogUploadCleanup,
  });
  res.status(catalogUploadCleanup.status === "degraded" ? 503 : 200).json(data);
});

export default router;
