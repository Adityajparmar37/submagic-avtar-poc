import "dotenv/config";
import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import path from "path";
import fs from "fs";

import generateRouter from "./routes/generate.ts";
import videoRouter from "./routes/video.ts";
import cleanupRouter from "./routes/cleanup.ts";

const app = new Koa();
const PORT = parseInt(process.env.PORT || "3001", 10);

// ─── Middleware ───
app.use(cors({ origin: "*" }));
app.use(
  bodyParser({
    jsonLimit: "5mb",
    enableTypes: ["json"],
  })
);

// ─── Request logging ───
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} — ${ctx.status} (${ms}ms)`);
});

// ─── Serve static avatars (for dev without Vite) ───
app.use(async (ctx, next) => {
  if (ctx.path.startsWith("/avatars/")) {
    const filePath = path.join(process.cwd(), "public", ctx.path);
    if (fs.existsSync(filePath)) {
      ctx.type = path.extname(filePath);
      ctx.body = fs.createReadStream(filePath);
      return;
    }
  }
  await next();
});

// ─── Routes ───
app.use(generateRouter.routes()).use(generateRouter.allowedMethods());
app.use(videoRouter.routes()).use(videoRouter.allowedMethods());
app.use(cleanupRouter.routes()).use(cleanupRouter.allowedMethods());

// ─── Health check ───
app.use(async (ctx) => {
  if (ctx.path === "/api/health") {
    ctx.body = { status: "ok", timestamp: new Date().toISOString() };
  }
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`\n🚀 SubMagic Avatar API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);

  // Validate env vars (TTS uses macOS say — no API key needed)
  const required = ["GEMINI_API_KEY", "GROQ_API_KEY"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(", ")}`);
    console.warn(`   Add them to a .env file in the project root.\n`);
  } else {
    console.log(`✅ All API keys configured\n`);
  }
});

export default app;
