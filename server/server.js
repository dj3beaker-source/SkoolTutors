// Skool Tutors — gated live demo backend.
// Serves the one-page demo and proxies the two live features to your keys:
//   • /api/tutor — Claude, with the HomeSkool Socratic "never give the answer" prompt
//   • /api/tts   — ElevenLabs (Teacher Sarah), grade-banded voice for the verbal tutor
// "Live but gated": when DEMO_CODE is set, the AI/voice endpoints require the matching
// x-demo-token header (the code visitors enter), so a leaked URL can't burn your keys.
// No Stripe, no DB — a demo needs neither.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load server/.env no matter the working directory (so `npm start` works from the repo
// root too). On Railway there is no .env file — config comes from Railway Variables.
dotenv.config({ path: path.join(__dirname, '.env') });
dns.setDefaultResultOrder('ipv4first'); // Railway IPv6 → prefer IPv4 for outbound HTTPS
const ROOT = path.join(__dirname, '..');
const app = express();
const PORT = process.env.PORT || 4243;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const DEMO_CODE = (process.env.DEMO_CODE || '').trim();
const PARENT_AGENT_ID = process.env.PARENT_AGENT_ID || 'agent_1401kv3jv1ymf1arjmpw25111w0q';

app.use(express.json());
app.use(express.static(ROOT));
app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// What the browser needs to know up front.
app.get('/config', (_req, res) => res.json({
  brand: 'Skool Tutors',
  aiProxy: Boolean(process.env.ANTHROPIC_API_KEY),
  ttsProxy: Boolean(process.env.ELEVENLABS_API_KEY),
  gated: Boolean(DEMO_CODE),
  parentAgentId: PARENT_AGENT_ID,
}));

// ── Demo gate ───────────────────────────────────────────────────────────────
const normCode = s => String(s || '').trim().toLowerCase(); // forgiving match: case + whitespace
app.post('/demo-auth', (req, res) => {
  if (!DEMO_CODE) return res.json({ ok: true, token: 'open' });
  if (normCode(req.body?.code) && normCode(req.body?.code) === normCode(DEMO_CODE)) return res.json({ ok: true, token: DEMO_CODE });
  return res.status(401).json({ error: 'Incorrect access code.' });
});
function requireDemo(req, res, next) {
  if (!DEMO_CODE) return next(); // open in local dev when no code configured
  if (normCode(req.headers['x-demo-token']) === normCode(DEMO_CODE)) return next();
  return res.status(401).json({ error: 'Demo access code required.' });
}
// Defense-in-depth: per-IP rate limit on the paid endpoints.
const hits = new Map();
const rateLimit = (max, winMs) => (req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < winMs);
  if (arr.length >= max) return res.status(429).json({ error: 'Demo rate limit reached — please pause a moment.' });
  arr.push(now); hits.set(ip, arr); next();
};

// ── Tutor proxy (Claude) — the Socratic guidelines from HomeSkool ───────────
app.post('/api/tutor', requireDemo, rateLimit(80, 30 * 60000), async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(501).json({ error: 'AI proxy not configured' });
  try {
    const { system, messages, model } = req.body;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6', max_tokens: 600, system, messages }),
    });
    res.status(r.status).json(await r.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Grade-banded voice (Teacher Sarah), identical to HomeSkool ──────────────
function gradeBand(grade) { const n = grade === 'K' ? 0 : parseInt(grade, 10); if (n <= 2) return 'early'; if (n <= 5) return 'elem'; if (n <= 8) return 'middle'; return 'high'; }
const TEACHER_SARAH = process.env.ELEVENLABS_VOICE_SARAH || 'EXAVITQu4vr4xnSDxMaL';
const VOICE_BY_BAND = { early: TEACHER_SARAH, elem: TEACHER_SARAH, middle: TEACHER_SARAH, high: TEACHER_SARAH };
const VOICE_SETTINGS = {
  early: { stability: 0.5, similarity_boost: 0.8, style: 0.30, use_speaker_boost: true, speed: 0.90 },
  elem: { stability: 0.5, similarity_boost: 0.8, style: 0.20, use_speaker_boost: true, speed: 0.95 },
  middle: { stability: 0.45, similarity_boost: 0.75, style: 0.20, use_speaker_boost: true, speed: 1.0 },
  high: { stability: 0.4, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: 1.0 },
};
app.post('/api/tts', requireDemo, rateLimit(240, 30 * 60000), async (req, res) => {
  if (!process.env.ELEVENLABS_API_KEY) return res.status(501).json({ error: 'TTS not configured' });
  try {
    const { text, grade = '5' } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'No text' });
    const band = gradeBand(grade);
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_BY_BAND[band]}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({ text: text.slice(0, 2500), model_id: process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5', voice_settings: VOICE_SETTINGS[band] }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: t.slice(0, 300) }); }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

await app.listen(PORT);
console.log(`Skool Tutors demo running at ${APP_URL}`);
console.log(`  • Demo:    ${APP_URL}/`);
console.log(`  • Gate:    ${DEMO_CODE ? 'ON (DEMO_CODE set — visitors must enter the code)' : 'OFF (no DEMO_CODE — endpoints are OPEN; set DEMO_CODE before going public)'}`);
console.log(`  • AI:      ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'NOT configured'}   TTS: ${process.env.ELEVENLABS_API_KEY ? 'configured' : 'NOT configured'}`);
