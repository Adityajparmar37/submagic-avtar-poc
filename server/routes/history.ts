import Router from "@koa/router";
import fs from "fs";
import path from "path";

const TEMP_ROOT = path.join(process.cwd(), "tmp");

const router = new Router();

/**
 * GET /api/history
 *
 * Returns all completed video sessions, newest first.
 * A session is "complete" when metadata.json + final.mp4 both exist.
 */
router.get("/api/history", async (ctx) => {
  const entries: object[] = [];

  if (!fs.existsSync(TEMP_ROOT)) {
    ctx.body = { success: true, sessions: [] };
    return;
  }

  const dirs = fs.readdirSync(TEMP_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const sessionId of dirs) {
    const metaPath  = path.join(TEMP_ROOT, sessionId, "metadata.json");
    const videoPath = path.join(TEMP_ROOT, sessionId, "final.mp4");

    if (!fs.existsSync(metaPath) || !fs.existsSync(videoPath)) continue;

    try {
      const meta = JSON.parse(await fs.promises.readFile(metaPath, "utf-8"));
      const stat = fs.statSync(videoPath);
      entries.push({ ...meta, fileSizeBytes: stat.size });
    } catch {
      // corrupt metadata — skip
    }
  }

  // Sort newest first
  entries.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  ctx.body = { success: true, sessions: entries };
});

export default router;
