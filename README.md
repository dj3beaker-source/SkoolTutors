# Skool Tutors 🎓 — live demo for schools

A focused, **gated live demo** for **school administrators, alternative schools, and
after-school programs**. It showcases the HomeSkool tutoring engine without payments or a
database — just the two things a buyer wants to see working:

1. **Two-way verbal tutor** — speak or type; Claude guides the student **Socratically** (never hands over the answer) and replies in the ElevenLabs "Teacher Sarah" voice. Voice-first onboarding (mic auto-prompt) so even non-readers can talk to it.
2. **Bilingual Parent Assistant** — explains a topic **to the parent** in plain language (gives answers + how-to-help tips), so caregivers can support learning at home, including across a language barrier.

**Live:** https://skooltutors.com (demo gate — access code required)
**Sibling product:** [HomeSkool](https://www.homeskooltutor.com) (`dj3beaker-source/HomeSkoolTutor`)

---

## Highlights
- **One engine for both panels** — tutor *and* parent assistant run on Claude (`/api/tutor`) + ElevenLabs TTS (`/api/tts`) + browser speech recognition. (No ElevenLabs ConvAI dependency.)
- **Bilingual + auto-detect** — full EN/ES toggle, and it **auto-switches** the whole experience (UI, agent replies, mic locale, lesson names) from what the user types/says — e.g. "no hablo inglés" → Spanish.
- **Agents surface videos** — the tutor can show the current lesson's video; the parent can pull up a video for any topic (inline player).
- **"Live but gated"** — protects your API keys (see below).

## Stack
Static `index.html` front-end + a tiny Node/Express server (`server/server.js`) that proxies
the AI/voice calls so keys never reach the browser. **No Stripe, no database.**
Claude · ElevenLabs · browser SpeechRecognition.

## Repo layout
```
index.html            The whole demo (gate, verbal tutor, parent assistant, EN/ES, video lib)
server/
  server.js           Express: static + /api/tutor, /api/tts, demo gate, /api/convai-signed-url*
  .env.example        Template for keys + DEMO_CODE
package.json          Root start (node server/server.js) for Railway
assets/               Sales video + poster
```
`*` legacy endpoint; the parent assistant now runs on Claude, so it's unused.

## Run locally
```bash
npm install                          # from the repo root
cp server/.env.example server/.env   # fill in keys + a DEMO_CODE
npm start                            # http://localhost:4243
```

## "Live but gated"
The tutor and parent assistant call your **Anthropic + ElevenLabs** keys, so the AI/voice
endpoints are protected:
- When **`DEMO_CODE`** is set, visitors must enter that code; every `/api/tutor` and
  `/api/tts` call must carry the matching `x-demo-token` header. A leaked URL can't burn
  your keys. (Matching is case-insensitive / whitespace-tolerant.)
- Per-IP **rate limits** add a second layer.
- Leave `DEMO_CODE` blank **only** for local testing — set it before going public.

## Deploy (Railway → skooltutors.com)
1. New Railway service from this repo (root `package.json` → `node server/server.js`).
2. **Variables:** `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `DEMO_CODE` (+ optional
   `ANTHROPIC_MODEL`, `ELEVENLABS_MODEL`, `ELEVENLABS_VOICE_SARAH`).
3. **Domain/DNS (GoDaddy):** add `www.skooltutors.com` as a Railway Custom Domain (Railway
   issues the SSL cert), point a **`www` CNAME** at the Railway host, and **forward the apex**
   `skooltutors.com → https://www.skooltutors.com`. HTTPS is required for the microphone.

## Notes
- Curriculum is a curated 4-lesson sample (`DEMO_LESSONS` in `index.html`) with real lesson
  videos in `DEMO_VIDEOS`; expand anytime.
- Browser speech recognition (mic input) works in **Chrome/Edge**; voice *output* is ElevenLabs.
- **Full platform architecture** (both products, all services, env-var reference, data flows)
  lives in the HomeSkool repo: `INTEGRATION.md`.

---

> **Secrets:** never commit keys. `.gitignore` excludes `.env`. All credentials live in
> Railway Variables (prod) or a local gitignored `server/.env` (testing).
