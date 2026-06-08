import Router from "@koa/router";
import path from "path";
import fs from "fs";
import type { GenerateRequest } from "../../src/lib/types.ts";
import { TOTAL_PIPELINE_STEPS } from "../../src/lib/constants.ts";
import { enhanceScript } from "../services/gemini.ts";
import { createSessionDir, newSessionId } from "../services/storage.ts";
import { generateTalkingAvatar } from "../services/lipsync.ts";
import { transcribeAudio } from "../services/transcription.ts";
import { generateASS } from "../services/captions.ts";
import { burnCaptions, extractAudio } from "../services/video.ts";

const router = new Router();

router.post("/api/generate-video", async (ctx) => {
  const body = ctx.request.body as GenerateRequest;

  if (!body.avatar || !body.script || !body.voice || !body.emotion || !body.captionStyle) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Missing required fields" };
    return;
  }

  if (body.script.trim().length < 10) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Script must be at least 10 characters" };
    return;
  }

  // SSE — ctx.respond = false prevents Koa from touching the response after handler returns
  ctx.respond = false;
  ctx.res.setHeader("Content-Type", "text/event-stream");
  ctx.res.setHeader("Cache-Control", "no-cache");
  ctx.res.setHeader("Connection", "keep-alive");
  ctx.res.setHeader("X-Accel-Buffering", "no");
  ctx.res.statusCode = 200;
  ctx.res.flushHeaders();

  const stream = ctx.res;

  function sendProgress(step: number, message: string) {
    stream.write(
      `data: ${JSON.stringify({ type: "progress", data: { step, totalSteps: TOTAL_PIPELINE_STEPS, status: "processing", message } })}\n\n`
    );
  }

  function sendComplete(videoUrl: string) {
    stream.write(`data: ${JSON.stringify({ type: "complete", data: { videoUrl } })}\n\n`);
  }

  function sendError(error: string) {
    stream.write(`data: ${JSON.stringify({ type: "error", data: { error } })}\n\n`);
  }

  const sessionId = newSessionId();
  const sessionDir = createSessionDir(sessionId);

  // "avatar1.png" → "avatar1"
  const avatarId = path.basename(body.avatar, path.extname(body.avatar));

  try {
    // ── Step 1: Enhance script with Gemini ──
    sendProgress(1, "Processing Script — Enhancing with AI...");
    console.log(`[pipeline:${sessionId}] Step 1: Enhancing script`);
    const enhancedScript = await enhanceScript(body.script, body.emotion);

    // ── Step 2: Generate talking avatar with Tavus ──
    sendProgress(2, "Creating Talking Avatar — Submitting to Tavus...");
    console.log(`[pipeline:${sessionId}] Step 2: Tavus avatar`);

    const avatarVideoPath = path.join(sessionDir, "avatar.mp4");
    await generateTalkingAvatar(
      avatarId,
      enhancedScript,
      avatarVideoPath,
      (msg) => sendProgress(2, `Creating Talking Avatar — ${msg}`)
    );
    console.log(`[pipeline:${sessionId}] Avatar video: ${avatarVideoPath}`);

    // ── Step 3: Transcribe avatar audio and generate captions ──
    sendProgress(3, "Generating Captions — Transcribing audio...");
    console.log(`[pipeline:${sessionId}] Step 3: Transcribing`);

    const extractedAudioPath = path.join(sessionDir, "audio.wav");
    await extractAudio(avatarVideoPath, extractedAudioPath);
    const transcription = await transcribeAudio(extractedAudioPath);
    console.log(`[pipeline:${sessionId}] ${transcription.words.length} words`);

    const assContent = generateASS(transcription, body.captionStyle);
    const assPath = path.join(sessionDir, "captions.ass");
    await fs.promises.writeFile(assPath, assContent, "utf-8");

    // ── Step 4: Burn captions ──
    sendProgress(4, "Rendering Final Video — Burning captions...");
    console.log(`[pipeline:${sessionId}] Step 4: Burning captions`);
    const finalVideoPath = path.join(sessionDir, "final.mp4");
    await burnCaptions(avatarVideoPath, assPath, finalVideoPath);

    // ── Step 5: Done ──
    sendProgress(5, "Complete — Your video is ready!");
    sendComplete(`/api/video/${sessionId}`);
    console.log(`[pipeline:${sessionId}] Done!`);

  } catch (err: any) {
    console.error(`[pipeline:${sessionId}] Error:`, err);
    sendError(err.message || "An unexpected error occurred");
  } finally {
    stream.end();
  }
});

export default router;
