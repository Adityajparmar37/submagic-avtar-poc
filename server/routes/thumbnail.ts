import Router from "@koa/router";
import fs from "fs";
import { getSessionFilePath } from "../services/storage.ts";
import { generateThumbnail, type ThumbnailStyle } from "../services/thumbnail.ts";

const VALID_STYLES = new Set<ThumbnailStyle>([
  "engaging",
  "normal",
  "cinematic",
  "professional",
  "dynamic",
]);

const router = new Router();

/**
 * POST /api/thumbnail/:id
 *
 * Generate a Gemini AI thumbnail from the session's clean avatar video.
 * Body: { style: ThumbnailStyle }
 */
router.post("/api/thumbnail/:id", async (ctx) => {
  const { id } = ctx.params;
  const { style = "engaging" } = ctx.request.body as { style?: ThumbnailStyle };

  if (!VALID_STYLES.has(style)) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      error: `Invalid style. Choose from: ${[...VALID_STYLES].join(", ")}`,
    };
    return;
  }

  // Verify the session's source video exists
  const avatarVideoPath = getSessionFilePath(id, "avatar.mp4");
  if (!fs.existsSync(avatarVideoPath)) {
    ctx.status = 404;
    ctx.body = { success: false, error: "Session video not found" };
    return;
  }

  const thumbnailPath = getSessionFilePath(id, `thumbnail_${style}.jpg`);

  try {
    await generateThumbnail(id, style, thumbnailPath);
    ctx.body = {
      success: true,
      thumbnailUrl: `/api/thumbnail/${id}/${style}`,
    };
  } catch (err: any) {
    console.error("[thumbnail] Generation error:", err);
    ctx.status = 500;
    ctx.body = { success: false, error: err.message || "Thumbnail generation failed" };
  }
});

/**
 * GET /api/thumbnail/:id/:style
 *
 * Serve a previously generated thumbnail JPEG.
 */
router.get("/api/thumbnail/:id/:style", async (ctx) => {
  const { id, style } = ctx.params;

  if (!VALID_STYLES.has(style as ThumbnailStyle)) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid style" };
    return;
  }

  const thumbnailPath = getSessionFilePath(id, `thumbnail_${style}.jpg`);
  if (!fs.existsSync(thumbnailPath)) {
    ctx.status = 404;
    ctx.body = { success: false, error: "Thumbnail not found. Generate it first." };
    return;
  }

  const stat = fs.statSync(thumbnailPath);
  ctx.set("Content-Type", "image/jpeg");
  ctx.set("Content-Length", String(stat.size));
  ctx.set("Cache-Control", "public, max-age=3600");
  ctx.body = fs.createReadStream(thumbnailPath);
});

export default router;
