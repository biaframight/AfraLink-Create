import { Router, type IRouter } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, driversTable, rentalsTable, bookingsTable, reportsTable, usersTable } from "@workspace/db";
import {
  GetAdminStatsResponse,
  ListPendingDriversResponse,
  ApproveDriverParams,
  ApproveDriverResponse,
  RejectDriverParams,
  RejectDriverBody,
  RejectDriverResponse,
  ListPendingRentalsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const [
    customerCount,
    driverCount,
    rentalCount,
    pendingDriverCount,
    pendingRentalCount,
    bookingCount,
    reportCount,
    topStates,
    topVehicleTypes,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "customer")),
    db.select({ count: sql<number>`count(*)` }).from(driversTable).where(eq(driversTable.verificationStatus, "approved")),
    db.select({ count: sql<number>`count(*)` }).from(rentalsTable).where(eq(rentalsTable.verificationStatus, "approved")),
    db.select({ count: sql<number>`count(*)` }).from(driversTable).where(eq(driversTable.verificationStatus, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(rentalsTable).where(eq(rentalsTable.verificationStatus, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(bookingsTable),
    db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(eq(reportsTable.status, "open")),
    db.select({ state: driversTable.state, count: sql<number>`count(*)` }).from(driversTable).groupBy(driversTable.state).orderBy(sql`count(*) desc`).limit(5),
    db.select({ vehicleType: driversTable.vehicleType, count: sql<number>`count(*)` }).from(driversTable).groupBy(driversTable.vehicleType).orderBy(sql`count(*) desc`).limit(5),
  ]);

  res.json(GetAdminStatsResponse.parse({
    totalCustomers: Number(customerCount[0]?.count ?? 0),
    totalDrivers: Number(driverCount[0]?.count ?? 0),
    totalRentals: Number(rentalCount[0]?.count ?? 0),
    pendingDrivers: Number(pendingDriverCount[0]?.count ?? 0),
    pendingRentals: Number(pendingRentalCount[0]?.count ?? 0),
    totalBookings: Number(bookingCount[0]?.count ?? 0),
    totalReports: Number(reportCount[0]?.count ?? 0),
    topStates: topStates.map(s => ({ state: s.state, count: Number(s.count) })),
    topVehicleTypes: topVehicleTypes.map(v => ({ vehicleType: v.vehicleType, count: Number(v.count) })),
  }));
});

router.get("/admin/pending-drivers", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const drivers = await db.select().from(driversTable).where(eq(driversTable.verificationStatus, "pending")).orderBy(driversTable.createdAt);
  res.json(ListPendingDriversResponse.parse({ drivers, total: drivers.length }));
});

router.post("/admin/drivers/:id/approve", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [driver] = await db.update(driversTable).set({ verificationStatus: "approved" }).where(eq(driversTable.id, id)).returning();
  if (!driver) { res.status(404).json({ error: "Driver not found" }); return; }

  res.json(ApproveDriverResponse.parse(driver));
});

router.post("/admin/drivers/:id/reject", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const note = RejectDriverBody.safeParse(req.body);

  const [driver] = await db.update(driversTable)
    .set({ verificationStatus: "rejected", rejectionNote: note.success ? note.data.note ?? null : null })
    .where(eq(driversTable.id, id))
    .returning();

  if (!driver) { res.status(404).json({ error: "Driver not found" }); return; }
  res.json(RejectDriverResponse.parse(driver));
});

router.get("/admin/pending-rentals", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const rentals = await db.select().from(rentalsTable).where(eq(rentalsTable.verificationStatus, "pending")).orderBy(rentalsTable.createdAt);
  res.json(ListPendingRentalsResponse.parse({ rentals, total: rentals.length }));
});

router.post("/admin/rentals/:id/approve", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [rental] = await db.update(rentalsTable).set({ verificationStatus: "approved" }).where(eq(rentalsTable.id, id)).returning();
  if (!rental) { res.status(404).json({ error: "Rental not found" }); return; }
  res.json(rental);
});

router.post("/admin/rentals/:id/reject", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [rental] = await db.update(rentalsTable).set({ verificationStatus: "rejected" }).where(eq(rentalsTable.id, id)).returning();
  if (!rental) { res.status(404).json({ error: "Rental not found" }); return; }
  res.json(rental);
});

router.post("/admin/users/:id/suspend", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.update(usersTable).set({ isSuspended: true }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.get("/admin/reports", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const reports = await db.select().from(reportsTable).orderBy(reportsTable.createdAt);
  res.json({ reports });
});

export default router;
