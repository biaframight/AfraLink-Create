import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, bookingsTable, driversTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookings", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = ListBookingsQueryParams.safeParse(req.query);
  const role = params.success ? params.data.role : undefined;

  let bookings;
  if (role === "driver") {
    const [driverProfile] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user.id));
    if (!driverProfile) {
      res.json(ListBookingsResponse.parse({ bookings: [] }));
      return;
    }
    bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.driverId, driverProfile.id));
  } else {
    bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.customerId, req.user.id));
  }

  res.json(ListBookingsResponse.parse({ bookings }));
});

router.post("/bookings", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({ ...parsed.data, customerId: req.user.id, status: "pending" })
    .returning();

  res.status(201).json(GetBookingResponse.parse(booking));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
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

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(GetBookingResponse.parse(booking));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
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

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [updated] = await db.update(bookingsTable).set(parsed.data).where(eq(bookingsTable.id, id)).returning();

  res.json(UpdateBookingResponse.parse(updated));
});

export default router;
