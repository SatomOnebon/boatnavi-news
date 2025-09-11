// server/api/healthz.get.ts
export default defineEventHandler(() => ({ ok: true, ts: new Date().toISOString() }))