import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now, current_database() as db");
    res.json({
      status: "ok",
      db: result.rows[0]?.db,
      now: result.rows[0]?.now,
      env: {
        hasSupabase: !!process.env.SUPABASE_DATABASE_URL,
        hasDatabase: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message,
      code: err.code,
      env: {
        hasSupabase: !!process.env.SUPABASE_DATABASE_URL,
        hasDatabase: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  }
});

export default router;
