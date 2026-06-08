import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const TEMP_ROOT = path.join(process.cwd(), "tmp");

function ensureTempRoot(): void {
  if (!fs.existsSync(TEMP_ROOT)) {
    fs.mkdirSync(TEMP_ROOT, { recursive: true });
  }
}

export function createSessionDir(sessionId: string): string {
  ensureTempRoot();
  const sessionDir = path.join(TEMP_ROOT, sessionId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  return sessionDir;
}

export function newSessionId(): string {
  return uuidv4();
}

export async function saveTempFile(
  sessionDir: string,
  filename: string,
  data: Buffer
): Promise<string> {
  const filePath = path.join(sessionDir, filename);
  await fs.promises.writeFile(filePath, data);
  return filePath;
}

export async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.promises.writeFile(destPath, Buffer.from(arrayBuffer));
  console.log(`[storage] Downloaded to ${destPath}`);
}

export function cleanupSession(sessionId: string): void {
  const sessionDir = path.join(TEMP_ROOT, sessionId);
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
}

export function getSessionFilePath(sessionId: string, filename: string): string {
  return path.join(TEMP_ROOT, sessionId, filename);
}
