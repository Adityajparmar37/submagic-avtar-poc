import fs from "fs";

const TAVUS_API_KEY = process.env.TAVUS_API_KEY ?? "";
const BASE_URL = "https://tavusapi.com";

// Map avatar IDs to Tavus replica IDs.
// Set TAVUS_REPLICA_ID_AVATAR1 etc., or TAVUS_REPLICA_ID as a catch-all fallback.
const REPLICA_ID: Record<string, string> = {
  avatar1: process.env.TAVUS_REPLICA_ID_AVATAR1 ?? process.env.TAVUS_REPLICA_ID ?? "",
  avatar2: process.env.TAVUS_REPLICA_ID_AVATAR2 ?? process.env.TAVUS_REPLICA_ID ?? "",
  avatar3: process.env.TAVUS_REPLICA_ID_AVATAR3 ?? process.env.TAVUS_REPLICA_ID ?? "",
  avatar4: process.env.TAVUS_REPLICA_ID_AVATAR4 ?? process.env.TAVUS_REPLICA_ID ?? "",
};

const POLL_INTERVAL_MS = 6_000;
const POLL_TIMEOUT_MS  = 10 * 60 * 1000;

async function tavusPost(endpoint: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "x-api-key": TAVUS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavus POST ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function tavusGet(endpoint: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "x-api-key": TAVUS_API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavus GET ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const buf = await res.arrayBuffer();
  await fs.promises.writeFile(dest, Buffer.from(buf));
}

/**
 * Generate a talking-avatar video via the Tavus API.
 *
 * Required env vars:
 *   TAVUS_API_KEY
 *   TAVUS_REPLICA_ID              (fallback for all avatars)
 *   TAVUS_REPLICA_ID_AVATAR1..4   (per-avatar overrides)
 *
 * @param avatarId   e.g. "avatar1" — maps to a Tavus replica
 * @param script     The text the avatar will speak
 * @param outputPath Local path to write the downloaded MP4
 * @param onStatus   Optional callback for polling status strings
 */
export async function generateTalkingAvatar(
  avatarId: string,
  script: string,
  outputPath: string,
  onStatus?: (msg: string) => void
): Promise<void> {
  if (!TAVUS_API_KEY) {
    throw new Error("TAVUS_API_KEY environment variable is not set.");
  }

  const replicaId = REPLICA_ID[avatarId] ?? "";
  if (!replicaId) {
    throw new Error(
      `No Tavus replica ID configured for "${avatarId}". ` +
      `Set TAVUS_REPLICA_ID_${avatarId.toUpperCase()} or TAVUS_REPLICA_ID.`
    );
  }

  console.log(`[tavus] Creating video — replica ${replicaId}`);

  const created = await tavusPost("/v2/videos", {
    replica_id: replicaId,
    script,
    video_name: `submagic_${Date.now()}`,
  }) as { video_id: string };

  const { video_id } = created;
  console.log(`[tavus] Job created: ${video_id}`);
  onStatus?.("Rendering avatar video...");

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let elapsed = 0;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    elapsed += POLL_INTERVAL_MS;

    const status = await tavusGet(`/v2/videos/${video_id}`) as {
      status: string;
      download_url?: string;
      error?: string;
    };

    console.log(`[tavus] ${video_id} → ${status.status} (${Math.round(elapsed / 1000)}s)`);
    onStatus?.(`Rendering avatar video... ${Math.round(elapsed / 1000)}s`);

    if (status.status === "ready") {
      if (!status.download_url) {
        throw new Error("Tavus video is ready but returned no download_url.");
      }
      console.log("[tavus] Downloading video...");
      await downloadFile(status.download_url, outputPath);
      console.log(`[tavus] Saved: ${outputPath}`);
      return;
    }

    if (status.status === "failed") {
      throw new Error(`Tavus video failed: ${status.error ?? "unknown error"}`);
    }
  }

  throw new Error(`Tavus video timed out after ${POLL_TIMEOUT_MS / 60_000} minutes.`);
}
