import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, driversTable, reviewsTable } from "@workspace/db";
import {
  ListDriversQueryParams,
  ListDriversResponse,
  CreateDriverHeader,
  CreateDriverBody,
  GetDriverParams,
  GetDriverResponse,
  UpdateDriverParams,
  UpdateDriverBody,
  UpdateDriverResponse,
  GetMyDriverHeader,
  GetMyDriverResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/drivers", async (req, res): Promise<void> => {
  const params = ListDriversQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { state, city, vehicleType, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(driversTable.verificationStatus, "approved"), eq(driversTable.isAvailable, true)];
  if (state) conditions.push(eq(driversTable.state, state));
  if (city) conditions.push(eq(driversTable.city, city));
  if (vehicleType) conditions.push(eq(driversTable.vehicleType, vehicleType));

  const [drivers, countResult] = await Promise.all([
    db.select().from(driversTable).where(and(...conditions)).limit(limit).offset(offset).orderBy(driversTable.isFeatured, driversTable.averageRating),
    db.select({ count: sql<number>`count(*)` }).from(driversTable).where(and(...conditions)),
  ]);

  res.json(ListDriversResponse.parse({ drivers, total: Number(countResult[0]?.count ?? 0) }));
});

router.get("/drivers/me", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user.id));

  if (!driver) {
    res.status(404).json({ error: "No driver profile found" });
    return;
  }

  res.json(GetMyDriverResponse.parse(driver));
});

router.post("/drivers", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(driversTable).where(eq(driversTable.userId, req.user.id));
  if (existing.length > 0) {
    res.status(400).json({ error: "Driver profile already exists" });
    return;
  }

  const [driver] = await db
    .insert(driversTable)
    .values({ ...parsed.data, userId: req.user.id, verificationStatus: "pending" })
    .returning();

  res.status(201).json(GetDriverResponse.parse(driver));
});

router.get("/drivers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, id));

  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  res.json(GetDriverResponse.parse(driver));
});

router.patch("/drivers/:id", async (req, res): Promise<void> => {
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

  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(driversTable).where(eq(driversTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  if (existing.userId !== req.user.id && req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db.update(driversTable).set(parsed.data).where(eq(driversTable.id, id)).returning();

  res.json(UpdateDriverResponse.parse(updated));
});

export default router;
