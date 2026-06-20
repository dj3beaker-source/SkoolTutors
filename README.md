# Skool Tutors — live demo (skooltutors.com)

A focused one-page demo for **school administrators, alternative schools, and after-school programs**, showing two live features from the HomeSkool engine:

1. **Two-way verbal tutor** — speak or type; Claude guides the student Socratically (never gives the answer) and replies in the ElevenLabs "Teacher Sarah" voice.
2. **Bilingual parent agent** — an ElevenLabs Conversational-AI voice coach that explains the current lesson to a *parent* (English or Spanish).

## Run locally
```bash
npm install                       # from the repo root
cp server/.env.example server/.env  # then fill in the keys + a DEMO_CODE
npm start                         # http://localhost:4243
```

## "Live but gated"
The tutor and parent agent call your Anthropic + ElevenLabs keys, so the AI/voice
endpoints are protected: when **`DEMO_CODE`** is set, visitors must enter that code,
and every `/api/tutor` and `/api/tts` call must carry the matching `x-demo-token`
header. A leaked URL can't burn your keys. Per-IP rate limits add a second layer.
Leave `DEMO_CODE` blank only for local testing.

## Deploy (Railway → skooltutors.com)
1. New Railway service from this repo; root = repo root, start = `node server/server.js`.
2. Set Variables: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `DEMO_CODE`, optionally
   `ANTHROPIC_MODEL`, `ELEVENLABS_MODEL`, `ELEVENLABS_VOICE_SARAH`, `PARENT_AGENT_ID`.
3. Point `skooltutors.com` at the service.
4. In the **ElevenLabs dashboard**, add `skooltutors.com` to the parent agent's
   **allowed domains** so the `<elevenlabs-convai>` widget runs there.

## Notes
- No Stripe, no database — a demo needs neither.
- Curriculum is a curated 4-lesson sample (`DEMO_LESSONS` in `index.html`); expand anytime.
- Browser speech recognition (mic input) works in Chrome/Edge; the voice *output* is ElevenLabs.
