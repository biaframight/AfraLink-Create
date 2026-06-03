import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetMyProfileResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));

  if (!user) {
    const [created] = await db
      .insert(usersTable)
      .values({
        id: req.user.id,
        email: req.user.email ?? null,
        fullName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName ?? ""}`.trim() : null,
        profilePhotoUrl: req.user.profileImageUrl ?? null,
        role: "customer",
      })
      .returning();
    res.json(GetMyProfileResponse.parse(created));
    return;
  }

  res.json(GetMyProfileResponse.parse(user));
});

router.patch("/users/me", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!existing) {
    await db.insert(usersTable).values({
      id: req.user.id,
      email: req.user.email ?? null,
      fullName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName ?? ""}`.trim() : null,
      profilePhotoUrl: req.user.profileImageUrl ?? null,
      role: "customer",
    });
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.user.id))
    .returning();

  res.json(UpdateMyProfileResponse.parse(updated));
});

export default router;
