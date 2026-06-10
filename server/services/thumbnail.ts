import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { getVideoDuration } from "./video.ts";
import { getSessionFilePath } from "./storage.ts";

export type ThumbnailStyle = "engaging" | "normal" | "cinematic" | "professional" | "dynamic";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const IMPACT_FONT  = "/System/Library/Fonts/Supplemental/Impact.ttf";
const ARIAL_B_FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
const resolveFont  = () => fs.existsSync(IMPACT_FONT) ? IMPACT_FONT : fs.existsSync(ARIAL_B_FONT) ? ARIAL_B_FONT : "";

// ── Style configs ────────────────────────────────────────────────────────────

const STYLE: Record<ThumbnailStyle, {
  eq: string;
  bgColor: string;   // 0xRRGGBB for FFmpeg drawbox
  bgAlpha: number;
  accentColor: string; // 0xRRGGBB for FFmpeg drawtext
  accentName: string;  // English name for AI prompts
  vibe: string;
  expression: string;
}> = {
  engaging:     { eq:"saturation=1.8:contrast=1.25:brightness=0.0",  bgColor:"0x8B0000", bgAlpha:.88, accentColor:"0xFFD700", accentName:"bright gold",    vibe:"energetic warm exciting",         expression:"excited, enthusiastic, huge smile"  },
  normal:       { eq:"saturation=1.3:contrast=1.1:brightness=0.0",   bgColor:"0x0D1B3E", bgAlpha:.88, accentColor:"0x00B4D8", accentName:"sky blue",        vibe:"professional clean",              expression:"confident, friendly smile"          },
  cinematic:    { eq:"saturation=0.7:contrast=1.5:brightness=-0.1",  bgColor:"0x0D0D1A", bgAlpha:.92, accentColor:"0xFF2244", accentName:"vivid red",        vibe:"dark dramatic mysterious",        expression:"intense, dramatic, serious"         },
  professional: { eq:"saturation=1.0:contrast=1.2:brightness=0.0",   bgColor:"0x0A1628", bgAlpha:.88, accentColor:"0x00AAFF", accentName:"electric blue",   vibe:"authoritative corporate polished", expression:"confident, authoritative"           },
  dynamic:      { eq:"saturation=2.0:contrast=1.35:brightness=0.02", bgColor:"0x990000", bgAlpha:.90, accentColor:"0xFFE600", accentName:"neon yellow",      vibe:"explosive bold high-energy",      expression:"shocked, wide-eyed, amazed"         },
};

const FRAME_POS: Record<ThumbnailStyle, number> = {
  engaging:.33, normal:.50, cinematic:.40, professional:.20, dynamic:.60,
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Step 1: Extract clean frame from avatar.mp4 ──────────────────────────────

function extractCleanFrame(videoPath: string, out: string, style: ThumbnailStyle): Promise<void> {
  return new Promise(async (res, rej) => {
    try {
      const dur = await getVideoDuration(videoPath);
      const t = Math.max(.5, Math.min(dur * FRAME_POS[style], dur - .5));
      ffmpeg(videoPath).seekInput(t).outputOptions(["-vframes 1","-q:v 2"]).output(out)
        .on("end",()=>res()).on("error",(e:Error)=>rej(e)).run();
    } catch(e){ rej(e); }
  });
}

// ── Step 2: Gemini Vision → concept (hook text + detailed AI prompt) ─────────

interface Concept { hookLine: string; subLine: string; aiPrompt: string; }

async function generateConcept(framePath: string, script: string, style: ThumbnailStyle): Promise<Concept> {
  const s = STYLE[style];
  const frameB64 = (await fs.promises.readFile(framePath)).toString("base64");

  const defaults: Concept = {
    hookLine: ({engaging:"YOU NEED THIS",normal:"MUST WATCH",cinematic:"TRUTH REVEALED",professional:"EXPERT TIPS",dynamic:"MIND BLOWN"})[style],
    subLine:  ({engaging:"WATCH NOW",normal:"SEE MORE",cinematic:"WATCH NOW",professional:"LEARN MORE",dynamic:"SEE NOW"})[style],
    aiPrompt: "",
  };

  const prompt =
`You are a YouTube thumbnail designer and Stable Diffusion FLUX prompt expert.

Analyze this video frame and the script below. Return JSON only.

SCRIPT: "${script.slice(0,350)}"
THUMBNAIL STYLE: ${s.vibe}

Return JSON with these fields:
1. personDesc: Describe the person (gender, hair color+style, skin tone, clothing exact color+type). 2-3 sentences.
2. hookLine: 2-4 word ALL CAPS clickbait headline. MAX 14 chars. Related to the topic.
3. subLine: 2-3 word ALL CAPS sub-text. MAX 12 chars. Urgent/emotional.
4. aiPrompt: A complete FLUX Stable Diffusion prompt for a YouTube thumbnail. Use the actual hookLine/subLine in it.

The aiPrompt structure:
"Professional YouTube clickbait thumbnail, 16:9 landscape 1280x720px, high quality photorealistic. [personDesc] positioned on LEFT SIDE with ${s.expression}, dramatic studio key lighting from left, slightly oversized heroic scale. RIGHT SIDE: ${s.vibe} dark gradient background (deep and rich). VERY LARGE bold white Impact font text '[hookLine]' with 8-pixel thick black outline at upper right. Below it: '[subLine]' in ${s.accentName} bold Impact font with black outline. Similar to top YouTube creator thumbnails. No watermarks, no subtitles."

Return ONLY valid JSON (no markdown fences):
{"personDesc":"...","hookLine":"TEXT","subLine":"TEXT","aiPrompt":"..."}`;

  try {
    const r = await genai.models.generateContent({
      model:"gemini-2.5-flash",
      contents:[{role:"user",parts:[{text:prompt},{inlineData:{mimeType:"image/jpeg",data:frameB64}}]}] as any,
    });
    const m = (r.text??'').match(/\{[\s\S]*\}/);
    if (!m) return defaults;
    const p = JSON.parse(m[0]);
    const hookLine = String(p.hookLine||defaults.hookLine).toUpperCase().slice(0,16);
    const subLine  = String(p.subLine||defaults.subLine).toUpperCase().slice(0,14);
    const personDesc = String(p.personDesc||"professional presenter");
    const aiPrompt = p.aiPrompt ||
      `Professional YouTube clickbait thumbnail, 16:9 1280x720px. ${personDesc} on LEFT SIDE with ${s.expression}, dramatic studio lighting. RIGHT SIDE: ${s.vibe} gradient background. HUGE white Impact text "${hookLine}" with thick black outline upper right. Below: "${subLine}" in ${s.accentName} Impact font. No watermarks.`;
    console.log(`[thumbnail] hook="${hookLine}" sub="${subLine}"`);
    return { hookLine, subLine, aiPrompt };
  } catch(e:any) {
    console.warn("[thumbnail] Concept failed:", e.message);
    return { ...defaults, aiPrompt: `Professional YouTube clickbait thumbnail 16:9. Presenter with ${s.expression} expression on left, ${s.vibe} background on right. Large bold white text "${defaults.hookLine}" with black outline. "${defaults.subLine}" in ${s.accentName}. No watermarks.` };
  }
}

// ── Step 3a: Stable Horde — FREE community AI (FLUX/SDXL), no API key ────────

const HORDE_URL = "https://stablehorde.net/api/v2";
const HORDE_KEY = "0000000000"; // anonymous free access

async function tryStableHorde(aiPrompt: string): Promise<Buffer | null> {
  try {
    // Submit
    // Anonymous key limits: ≤576×576 pixels, ≤50 steps
    // Use 512×320 (16:9-ish, both multiples of 64), scale up after
    const subRes = await fetch(`${HORDE_URL}/generate/async`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "apikey": HORDE_KEY },
      body: JSON.stringify({
        prompt: aiPrompt,
        params: { width:512, height:320, steps:20, cfg_scale:7.5, n:1, sampler_name:"k_euler_a" },
        r2: false,       // return base64 directly in status response
        censor_nsfw: false,
        slow_workers: true, // allow slower workers for better availability
      }),
    });

    if (!subRes.ok) {
      const txt = await subRes.text();
      console.warn("[thumbnail] Horde submit:", subRes.status, txt.slice(0,100));
      return null;
    }

    const { id } = await subRes.json() as { id: string };
    if (!id) return null;
    console.log("[thumbnail] Horde job:", id);

    // Poll until done (max 30s — anonymous key has low priority, fall back quickly)
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      await sleep(4000);

      const checkRes = await fetch(`${HORDE_URL}/generate/check/${id}`, { headers:{"apikey":HORDE_KEY} });
      if (!checkRes.ok) continue;

      const check = await checkRes.json() as { done:boolean; faulted?:boolean; queue_position?:number; wait_time?:number };
      console.log(`[thumbnail] Horde: queue=${check.queue_position} wait=${check.wait_time}s done=${check.done}`);

      if (check.faulted) { console.warn("[thumbnail] Horde faulted"); return null; }

      if (check.done) {
        const statusRes = await fetch(`${HORDE_URL}/generate/status/${id}`, { headers:{"apikey":HORDE_KEY} });
        if (!statusRes.ok) return null;
        const status = await statusRes.json() as { generations: Array<{img:string}> };
        let img = status.generations?.[0]?.img;
        if (!img) return null;
        if (img.startsWith("data:")) img = img.split(",")[1]; // strip data URL prefix
        const buf = Buffer.from(img, "base64");
        console.log(`[thumbnail] Stable Horde OK (${buf.length} bytes)`);
        return buf;
      }
    }
    console.warn("[thumbnail] Horde timed out");
    return null;
  } catch(e:any) {
    console.warn("[thumbnail] Horde error:", e.message);
    return null;
  }
}

// ── Step 3b: FFmpeg composition — professional YouTube thumbnail layout ───────
//
// Design:
//   • Full frame with HEAVY dramatic color treatment
//   • Vignette darkens edges (cinematic feel)
//   • Thin style-color accent bar at top (channel branding)
//   • 4-layer gradient fade from y≈400 → solid bottom panel
//   • HUGE Impact hook text, centered, white + 8px black stroke
//   • Large accent-color sub-text below
//   • Face is fully visible (overlay only covers lower body area)

async function composeFFmpeg(framePath: string, c: Concept, style: ThumbnailStyle, out: string): Promise<void> {
  const s = STYLE[style];
  const font = resolveFont();
  const fa = font ? `fontfile=’${font}’:` : "";
  const esc = (t: string) =>
    t.replace(/\\/g,"\\\\").replace(/’/g,"’").replace(/:/g,"\\:").replace(/\[/g,"\\[").replace(/\]/g,"\\]");

  // Adaptive font size based on hook text length (so it’s always as large as possible)
  const hookLen = c.hookLine.length;
  const hookSz  = hookLen <= 8 ? 115 : hookLen <= 12 ? 100 : hookLen <= 16 ? 88 : 78;
  const subSz   = 68;

  // 4-layer gradient for smooth fade (transparent → style color)
  const a0 = (s.bgAlpha * 0.10).toFixed(2);
  const a1 = (s.bgAlpha * 0.28).toFixed(2);
  const a2 = (s.bgAlpha * 0.58).toFixed(2);

  const filters = [
    // Resize to 1280×720
    `scale=1280:720:force_original_aspect_ratio=decrease`,
    `pad=1280:720:(ow-iw)/2:(oh-ih)/2:black`,
    // Heavy dramatic color treatment (makes avatar look intense/vivid)
    `eq=${s.eq}`,
    // Cinematic edge vignette
    `vignette=PI/4`,
    // Top accent stripe (style color, full opacity — channel branding feel)
    `drawbox=x=0:y=0:w=1280:h=14:color=${s.bgColor}@1.0:t=fill`,
    // Smooth 4-layer gradient fade into bottom panel
    `drawbox=x=0:y=390:w=1280:h=70:color=${s.bgColor}@${a0}:t=fill`,
    `drawbox=x=0:y=430:w=1280:h=60:color=${s.bgColor}@${a1}:t=fill`,
    `drawbox=x=0:y=468:w=1280:h=50:color=${s.bgColor}@${a2}:t=fill`,
    // Solid bottom panel for text
    `drawbox=x=0:y=500:w=1280:h=220:color=${s.bgColor}@${s.bgAlpha.toFixed(2)}:t=fill`,
    // Hook text — HUGE, centered, white with thick black stroke
    `drawtext=${fa}text=’${esc(c.hookLine)}’:fontsize=${hookSz}:fontcolor=white:borderw=8:bordercolor=black:x=(w-text_w)/2:y=508:fix_bounds=1`,
    // Sub-text — large, accent color, centered
    `drawtext=${fa}text=’${esc(c.subLine)}’:fontsize=${subSz}:fontcolor=${s.accentColor}:borderw=6:bordercolor=black:x=(w-text_w)/2:y=625:fix_bounds=1`,
  ];

  return new Promise((res, rej) => {
    ffmpeg(framePath)
      .outputOptions(["-vf", filters.join(","), "-vframes", "1", "-q:v", "2"])
      .output(out)
      .on("end", () => { console.log("[thumbnail] FFmpeg compose OK"); res(); })
      .on("error", (e: Error) => rej(new Error(`FFmpeg: ${e.message}`)))
      .run();
  });
}

// Scale image to 1280×720 JPEG
async function scaleAndSave(buf: Buffer, out: string): Promise<void> {
  const tmp = `${out}.tmp`;
  await fs.promises.writeFile(tmp, buf);
  await new Promise<void>((res,rej) => {
    ffmpeg(tmp)
      .outputOptions(["-vf","scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black","-q:v","2"])
      .output(out)
      .on("end",()=>res()).on("error",(e:Error)=>rej(e)).run();
  }).catch(async () => { await fs.promises.copyFile(tmp, out); });
  await fs.promises.unlink(tmp).catch(()=>{});
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a clickbait-style AI thumbnail.
 *
 * Priority:
 *  1. Stable Horde (free community FLUX/SDXL AI generation — no API key needed)
 *  2. FFmpeg bottom-text composition (person fully visible, guaranteed)
 */
export async function generateThumbnail(
  sessionId: string,
  style: ThumbnailStyle,
  outputPath: string
): Promise<void> {
  const avatarPath = getSessionFilePath(sessionId, "avatar.mp4");
  if (!fs.existsSync(avatarPath)) throw new Error("Avatar video not found");

  const framePath = `${outputPath}.frame.jpg`;
  await extractCleanFrame(avatarPath, framePath, style);

  let script = "";
  try { script = await fs.promises.readFile(getSessionFilePath(sessionId, "script.txt"), "utf-8"); }
  catch { /* optional */ }

  try {
    const concept = await generateConcept(framePath, script, style);

    // Primary: Stable Horde AI generation
    const aiBuffer = await tryStableHorde(concept.aiPrompt);

    if (aiBuffer) {
      await scaleAndSave(aiBuffer, outputPath);
    } else {
      // Fallback: FFmpeg bottom-text composition
      console.log("[thumbnail] Using FFmpeg composition fallback");
      await composeFFmpeg(framePath, concept, style, outputPath);
    }

  } catch(e:any) {
    console.error("[thumbnail] Fatal:", e.message);
    await fs.promises.copyFile(framePath, outputPath);
  } finally {
    await fs.promises.unlink(framePath).catch(()=>{});
  }
}
