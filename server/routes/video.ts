import Router from "@koa/router";
import fs from "fs";
import path from "path";
import { getSessionFilePath } from "../services/storage.ts";

const router = new Router();

/**
 * GET /api/video/:id
 *
 * Streams the final generated MP4 video.
 * Supports range requests for seekable video playback.
 */
router.get("/api/video/:id", async (ctx) => {
  const { id } = ctx.params;
  const videoPath = getSessionFilePath(id, "final.mp4");

  if (!fs.existsSync(videoPath)) {
    ctx.status = 404;
    ctx.body = { success: false, error: "Video not found" };
    return;
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;

  // Handle range requests
  const range = ctx.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    ctx.status = 206;
    ctx.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    ctx.set("Accept-Ranges", "bytes");
    ctx.set("Content-Length", String(chunkSize));
    ctx.set("Content-Type", "video/mp4");
    ctx.body = fs.createReadStream(videoPath, { start, end });
  } else {
    ctx.set("Content-Length", String(fileSize));
    ctx.set("Content-Type", "video/mp4");
    ctx.set("Accept-Ranges", "bytes");
    ctx.body = fs.createReadStream(videoPath);
  }
});

/**
 * GET /api/video/:id/download
 *
 * Downloads the final video with a proper filename.
 */
router.get("/api/video/:id/download", async (ctx) => {
  const { id } = ctx.params;
  const videoPath = getSessionFilePath(id, "final.mp4");

  if (!fs.existsSync(videoPath)) {
    ctx.status = 404;
    ctx.body = { success: false, error: "Video not found" };
    return;
  }

  const stat = fs.statSync(videoPath);
  ctx.set("Content-Type", "video/mp4");
  ctx.set("Content-Length", String(stat.size));
  ctx.set(
    "Content-Disposition",
    `attachment; filename="submagic-avatar-${Date.now()}.mp4"`
  );
  ctx.body = fs.createReadStream(videoPath);
});

export default router;
