import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Global JSON error handler — always return JSON, never HTML
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isDev = process.env.NODE_ENV !== "production";
  const isDbMissing =
    err.message?.includes("DATABASE_URL") ||
    err.message?.includes("password authentication") ||
    err.message?.includes("ECONNREFUSED") ||
    err.message?.includes("connect ETIMEDOUT");

  logger.error({ err }, "Unhandled route error");

  res.status(500).json({
    error: isDbMissing
      ? "Database connection failed — check SUPABASE_DATABASE_URL env var in Vercel"
      : "Internal server error",
    // Expose message always (not stack) to help diagnose production issues
    message: err.message,
    code: (err as any).code,
    dbEnv: {
      hasSupabase: !!process.env.SUPABASE_DATABASE_URL,
      hasDatabase: !!process.env.DATABASE_URL,
    },
  });
});

export default app;
