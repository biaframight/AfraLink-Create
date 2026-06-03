import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rentalsTable = pgTable("rentals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull(),
  ownerName: text("owner_name"),
  ownerPhone: text("owner_phone"),
  vehicleName: text("vehicle_name").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  color: text("color"),
  vehicleType: text("vehicle_type"),
  transmission: text("transmission"),
  fuelType: text("fuel_type"),
  seatingCapacity: integer("seating_capacity"),
  plateNumber: text("plate_number"),
  state: text("state").notNull(),
  city: text("city").notNull(),
  dailyPrice: real("daily_price").notNull(),
  weeklyPrice: real("weekly_price"),
  monthlyPrice: real("monthly_price"),
  photoUrls: text("photo_urls").array().notNull().default([]),
  verificationStatus: text("verification_status").notNull().default("pending"),
  isAvailable: boolean("is_available").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  averageRating: real("average_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRentalSchema = createInsertSchema(rentalsTable).omit({ createdAt: true, updatedAt: true });
export type InsertRental = z.infer<typeof insertRentalSchema>;
export type Rental = typeof rentalsTable.$inferSelect;
