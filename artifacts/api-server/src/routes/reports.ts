import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
import { CreateReportBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/reports", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({ ...parsed.data, reporterId: req.user.id, status: "open" })
    .returning();

  res.status(201).json(report);
});

export default router;
