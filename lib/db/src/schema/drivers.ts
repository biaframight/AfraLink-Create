import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const driversTable = pgTable("drivers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  state: text("state").notNull(),
  city: text("city").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleBrand: text("vehicle_brand"),
  vehicleModel: text("vehicle_model"),
  vehicleColor: text("vehicle_color"),
  plateNumber: text("plate_number"),
  ninNumber: text("nin_number"),
  ninSlipUrl: text("nin_slip_url"),
  selfieUrl: text("selfie_url"),
  vehiclePhotoUrl: text("vehicle_photo_url"),
  profilePhotoUrl: text("profile_photo_url"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  rejectionNote: text("rejection_note"),
  isAvailable: boolean("is_available").notNull().default(true),
  averageRating: real("average_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ createdAt: true, updatedAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
