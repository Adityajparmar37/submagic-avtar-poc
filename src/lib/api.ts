// In production the Vite build is served from Vercel (static) while the
// Koa API runs on a separate Railway server. VITE_API_URL points the
// frontend at that server (e.g. https://submagic.railway.app).
//
// In local dev VITE_API_URL is unset and all /api/* paths are handled by
// Vite's dev-server proxy (see vite.config.ts → server.proxy).

const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export const apiUrl = (path: string): string => `${base}${path}`;
