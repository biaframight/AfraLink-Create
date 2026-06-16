import { rm, mkdir, cp, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = (cmd) =>
  execSync(cmd, { stdio: "inherit", cwd: __dirname, env: process.env });

async function main() {
  // ── 1. Clean previous output ─────────────────────────────────────────────
  await rm(path.join(__dirname, ".vercel/output"), { recursive: true, force: true });
  await rm(path.join(__dirname, "public"), { recursive: true, force: true });

  // ── 2. Build the api-server (produces dist/app.cjs via esbuild) ──────────
  console.log("\n▶ Building API server...");
  run("pnpm --filter @workspace/api-server run build");

  // ── 3. Build the React frontend (VERCEL=1 → output goes to ./public) ─────
  console.log("\n▶ Building frontend...");
  execSync("pnpm --filter @workspace/afralink run build", {
    stdio: "inherit",
    cwd: __dirname,
    env: { ...process.env, BASE_PATH: "/", PORT: "3000", NODE_ENV: "production", VERCEL: "1" },
  });

  // ── 4. Assemble .vercel/output/static from ./public ──────────────────────
  console.log("\n▶ Copying static files...");
  const staticDir = path.join(__dirname, ".vercel/output/static");
  await mkdir(staticDir, { recursive: true });
  await cp(path.join(__dirname, "public"), staticDir, { recursive: true });

  // ── 5. Wire up the Express app as a Vercel Build Output API v3 function ───
  console.log("\n▶ Setting up serverless function...");
  const funcDir = path.join(__dirname, ".vercel/output/functions/api.func");
  await mkdir(funcDir, { recursive: true });

  // Copy the pre-built CJS bundle as app-bundle.js
  await cp(
    path.join(__dirname, "artifacts/api-server/dist/app.cjs"),
    path.join(funcDir, "app-bundle.js")
  );

  // Wrapper that catches load errors and returns JSON (not HTML 500)
  // so we can diagnose what went wrong in production.
  await writeFile(
    path.join(funcDir, "index.js"),
    `'use strict';
let appHandler;
let loadError;
try {
  const mod = require('./app-bundle.js');
  appHandler = mod.default || mod;
  if (typeof appHandler !== 'function') {
    loadError = new Error('App bundle did not export a function. Keys: ' + Object.keys(mod).join(', '));
    appHandler = null;
  }
} catch (err) {
  loadError = err;
}
module.exports = function handler(req, res) {
  if (loadError || !appHandler) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'App failed to load',
      message: loadError && loadError.message,
      stack: loadError && loadError.stack && loadError.stack.split('\\n').slice(0, 5),
      env: {
        hasSupabase: !!process.env.SUPABASE_DATABASE_URL,
        hasDatabase: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    }));
    return;
  }
  appHandler(req, res);
};
`
  );

  // Vercel function metadata
  await writeFile(
    path.join(funcDir, ".vc-config.json"),
    JSON.stringify({
      runtime: "nodejs20.x",
      handler: "index.js",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
    })
  );
  await writeFile(
    path.join(funcDir, "package.json"),
    JSON.stringify({ type: "commonjs" })
  );

  // ── 6. Vercel routing config ──────────────────────────────────────────────
  await writeFile(
    path.join(__dirname, ".vercel/output/config.json"),
    JSON.stringify({
      version: 3,
      routes: [
        { src: "/api/(.*)", dest: "/api" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    })
  );

  console.log("\n✓ .vercel/output is ready for deployment");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
