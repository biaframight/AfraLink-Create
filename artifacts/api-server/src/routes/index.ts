import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import usersRouter from "./users";
import driversRouter from "./drivers";
import rentalsRouter from "./rentals";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import reportsRouter from "./reports";
import locationsRouter from "./locations";
import adminRouter from "./admin";
import featuredRouter from "./featured";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(usersRouter);
router.use(driversRouter);
router.use(rentalsRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(reportsRouter);
router.use(locationsRouter);
router.use(adminRouter);
router.use(featuredRouter);

export default router;
