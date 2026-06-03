import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, driversTable, rentalsTable } from "@workspace/db";
import { ListFeaturedResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/featured", async (_req, res): Promise<void> => {
  const [drivers, rentals] = await Promise.all([
    db.select().from(driversTable)
      .where(and(eq(driversTable.verificationStatus, "approved"), eq(driversTable.isAvailable, true)))
      .orderBy(driversTable.isFeatured, driversTable.averageRating)
      .limit(8),
    db.select().from(rentalsTable)
      .where(and(eq(rentalsTable.verificationStatus, "approved"), eq(rentalsTable.isAvailable, true)))
      .orderBy(rentalsTable.isFeatured, rentalsTable.dailyPrice)
      .limit(8),
  ]);

  res.json(ListFeaturedResponse.parse({ drivers, rentals }));
});

export default router;
