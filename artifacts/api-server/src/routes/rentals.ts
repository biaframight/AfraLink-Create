import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, rentalsTable } from "@workspace/db";
import {
  ListRentalsQueryParams,
  ListRentalsResponse,
  CreateRentalBody,
  GetRentalParams,
  GetRentalResponse,
  UpdateRentalParams,
  UpdateRentalBody,
  UpdateRentalResponse,
  DeleteRentalParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/rentals", async (req, res): Promise<void> => {
  const params = ListRentalsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { state, city, vehicleType, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(rentalsTable.verificationStatus, "approved"), eq(rentalsTable.isAvailable, true)];
  if (state) conditions.push(eq(rentalsTable.state, state));
  if (city) conditions.push(eq(rentalsTable.city, city));
  if (vehicleType) conditions.push(eq(rentalsTable.vehicleType, vehicleType));

  const [rentals, countResult] = await Promise.all([
    db.select().from(rentalsTable).where(and(...conditions)).limit(limit).offset(offset).orderBy(rentalsTable.isFeatured, rentalsTable.dailyPrice),
    db.select({ count: sql<number>`count(*)` }).from(rentalsTable).where(and(...conditions)),
  ]);

  res.json(ListRentalsResponse.parse({ rentals, total: Number(countResult[0]?.count ?? 0) }));
});

router.post("/rentals", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateRentalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rental] = await db
    .insert(rentalsTable)
    .values({ ...parsed.data, userId: req.user.id, verificationStatus: "pending" })
    .returning();

  res.status(201).json(GetRentalResponse.parse(rental));
});

router.get("/rentals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [rental] = await db.select().from(rentalsTable).where(eq(rentalsTable.id, id));

  if (!rental) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }

  res.json(GetRentalResponse.parse(rental));
});

router.patch("/rentals/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateRentalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(rentalsTable).where(eq(rentalsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }

  if (existing.userId !== req.user.id && req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db.update(rentalsTable).set(parsed.data).where(eq(rentalsTable.id, id)).returning();

  res.json(UpdateRentalResponse.parse(updated));
});

router.delete("/rentals/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(rentalsTable).where(eq(rentalsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }

  if (existing.userId !== req.user.id && req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(rentalsTable).where(eq(rentalsTable.id, id));
  res.sendStatus(204);
});

export default router;
