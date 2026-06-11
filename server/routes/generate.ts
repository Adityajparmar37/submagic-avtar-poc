import Router from "@koa/router";
import path from "path";
import fs from "fs";
import type { GenerateRequest, PipelineTokenUsage } from "../../src/lib/types.ts";
import { TOTAL_PIPELINE_STEPS } from "../../src/lib/constants.ts";
import { enhanceScript } from "../services/gemini.ts";
import { createSessionDir, newSessionId } from "../services/storage.ts";
import { generateTalkingAvatar } from "../services/lipsync.ts";
import { transcribeAudio } from "../services/transcription.ts";
import { generateASS } from "../services/captions.ts";
import { burnCaptions, extractAudio, transformVideo } from "../services/video.ts";
import { mixSoundEffects, matchUserWordEffects } from "../services/sfx.ts";
import { CAPTION_STYLE_DEFAULTS } from "../../src/lib/constants.ts";

const router = new Router();

router.post("/api/generate-video", async (ctx) => {
  const body = ctx.request.body as GenerateRequest;

  if (!body.avatar || !body.script || !body.voice || !body.emotion || !body.captionStyle || !body.duration || !body.orientation) {
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

  function sendComplete(videoUrl: string, tokenUsage: PipelineTokenUsage) {
    stream.write(`data: ${JSON.stringify({ type: "complete", data: { videoUrl, tokenUsage } })}\n\n`);
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
    console.log(`[pipeline:${sessionId}] Step 1: Enhancing script (emotion=${body.emotion}, duration=${body.duration}s)`);
    const { text: enhancedScript, tokens: scriptTokens } = await enhanceScript(body.script, body.emotion, body.duration);

    // Save script for thumbnail generation context
    await fs.promises.writeFile(path.join(sessionDir, "script.txt"), enhancedScript, "utf-8");

    // ── Step 2: Generate talking avatar with Tavus ──
    sendProgress(2, "Creating Talking Avatar — Submitting to Tavus...");
    console.log(`[pipeline:${sessionId}] Step 2: Tavus avatar`);

    const avatarVideoPath = path.join(sessionDir, "avatar.mp4");
    await generateTalkingAvatar(
      avatarId,
      enhancedScript,
      avatarVideoPath,
      body.tavusOptions ?? {},
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

    const customization = body.captionCustomization ?? CAPTION_STYLE_DEFAULTS[body.captionStyle];
    const assContent = generateASS(transcription, body.captionStyle, customization);
    const assPath = path.join(sessionDir, "captions.ass");
    await fs.promises.writeFile(assPath, assContent, "utf-8");

    // ── Step 4: Sound effects ──
    const userSelections = body.soundEffectWords ?? [];
    const sfxInputPath  = path.join(sessionDir, "avatar.mp4");
    const sfxOutputPath = path.join(sessionDir, "avatar_sfx.mp4");

    if (userSelections.length > 0) {
      sendProgress(4, `Adding Sound Effects — Matching ${userSelections.length} word(s)...`);
      console.log(`[pipeline:${sessionId}] Step 4: matching ${userSelections.length} user-selected word(s)`);
      try {
        const effects = matchUserWordEffects(userSelections, transcription.words);
        sendProgress(4, `Adding Sound Effects — Mixing ${effects.length} effect(s)...`);
        await mixSoundEffects(sfxInputPath, sfxOutputPath, effects, sessionDir);
        console.log(`[pipeline:${sessionId}] Mixed ${effects.length} effect(s)`);
      } catch (sfxErr: any) {
        console.warn(`[pipeline:${sessionId}] Sound effects failed (continuing): ${sfxErr.message}`);
        await fs.promises.copyFile(sfxInputPath, sfxOutputPath);
      }
    } else {
      sendProgress(4, "Adding Sound Effects — None selected");
      await fs.promises.copyFile(sfxInputPath, sfxOutputPath);
    }

    // ── Step 5: Burn captions ──
    sendProgress(5, "Rendering Final Video — Burning captions...");
    console.log(`[pipeline:${sessionId}] Step 5: Burning captions`);
    const captionedVideoPath = path.join(sessionDir, "captioned.mp4");
    await burnCaptions(sfxOutputPath, assPath, captionedVideoPath);

    // ── Step 6: Apply orientation ──
    sendProgress(6, `Applying Format — ${body.orientation === "portrait" ? "9:16 portrait" : "16:9 landscape"}...`);
    console.log(`[pipeline:${sessionId}] Step 6: orientation=${body.orientation}`);
    const finalVideoPath = path.join(sessionDir, "final.mp4");
    await transformVideo(captionedVideoPath, finalVideoPath, body.orientation);

    // ── Step 7: Done ──
    const tokenUsage: PipelineTokenUsage = {
      scriptEnhancement: scriptTokens,
      total: {
        inputTokens:  scriptTokens.inputTokens,
        outputTokens: scriptTokens.outputTokens,
        totalTokens:  scriptTokens.totalTokens,
      },
    };

    // Save metadata so the History tab can list this session later
    const metadata = {
      sessionId,
      createdAt: new Date().toISOString(),
      avatarId,
      emotion:      body.emotion,
      voice:        body.voice,
      duration:     body.duration,
      orientation:  body.orientation,
      captionStyle: body.captionStyle,
      scriptSnippet: enhancedScript.slice(0, 120),
      tokenUsage,
    };
    await fs.promises.writeFile(
      path.join(sessionDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf-8"
    );

    console.log(
      `[pipeline:${sessionId}] Token summary — script: input=${scriptTokens.inputTokens} output=${scriptTokens.outputTokens} total=${scriptTokens.totalTokens}`
    );
    sendProgress(7, "Complete — Your video is ready!");
    sendComplete(`/api/video/${sessionId}`, tokenUsage);
    console.log(`[pipeline:${sessionId}] Done!`);

  } catch (err: any) {
    console.error(`[pipeline:${sessionId}] Error:`, err);
    sendError(err.message || "An unexpected error occurred");
  } finally {
    stream.end();
  }
});

export default router;
