import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reviewsTable, driversTable, rentalsTable, usersTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  ListReviewsResponse,
  CreateReviewBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { driverId, rentalId } = params.data;
  const conditions = [];
  if (driverId) conditions.push(eq(reviewsTable.driverId, driverId));
  if (rentalId) conditions.push(eq(reviewsTable.rentalId, rentalId));

  const reviews = conditions.length > 0
    ? await db.select().from(reviewsTable).where(and(...conditions)).orderBy(reviewsTable.createdAt)
    : await db.select().from(reviewsTable).orderBy(reviewsTable.createdAt);

  res.json(ListReviewsResponse.parse({ reviews }));
});

router.post("/reviews", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [userProfile] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));

  const [review] = await db
    .insert(reviewsTable)
    .values({
      ...parsed.data,
      reviewerId: req.user.id,
      reviewerName: userProfile?.fullName ?? req.user.firstName ?? null,
    })
    .returning();

  if (parsed.data.driverId) {
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.driverId, parsed.data.driverId));
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await db.update(driversTable)
      .set({ averageRating: avg, reviewCount: reviews.length })
      .where(eq(driversTable.id, parsed.data.driverId));
  }

  if (parsed.data.rentalId) {
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.rentalId, parsed.data.rentalId));
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await db.update(rentalsTable)
      .set({ averageRating: avg, reviewCount: reviews.length })
      .where(eq(rentalsTable.id, parsed.data.rentalId));
  }

  res.status(201).json(review);
});

export default router;
