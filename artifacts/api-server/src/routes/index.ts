import { Router, type IRouter } from "express";
import healthRouter from "./health";
import commerceRouter from "./commerce";
import storageRouter from "./storage";
import catalogRouter from "./catalog";
import pageCopyRouter from "./page-copy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(commerceRouter);
router.use(catalogRouter);
router.use(pageCopyRouter);
router.use(storageRouter);

export default router;
