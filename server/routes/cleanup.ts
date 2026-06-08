import Router from "@koa/router";
import { cleanupSession } from "../services/storage.ts";

const router = new Router();

/**
 * DELETE /api/cleanup/:id
 *
 * Cleans up temporary files for a completed session.
 */
router.delete("/api/cleanup/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    cleanupSession(id);
    console.log(`[cleanup] Session ${id} cleaned up`);
    ctx.body = { success: true };
  } catch (err: any) {
    console.error(`[cleanup] Error cleaning session ${id}:`, err);
    ctx.status = 500;
    ctx.body = { success: false, error: err.message };
  }
});

export default router;
