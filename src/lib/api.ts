// In production the Vite build is served from Vercel (static) while the
// Koa API runs on a separate Railway server. VITE_API_URL points the
// frontend at that server.
//
// Accepted formats for VITE_API_URL:
//   https://submagic-backend-xxxx.up.railway.app   ← preferred
//   submagic-backend-xxxx.up.railway.app            ← https:// added automatically
//
// In local dev VITE_API_URL is unset and all /api/* paths stay relative so
// Vite's dev-server proxy (vite.config.ts → server.proxy) handles them.

function normaliseBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  // Auto-add https:// when the caller forgot it — prevents the URL from being
  // treated as a relative path and accidentally prepended with the Vercel origin.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const base = normaliseBase(import.meta.env.VITE_API_URL ?? "");

export const apiUrl = (path: string): string => `${base}${path}`;
