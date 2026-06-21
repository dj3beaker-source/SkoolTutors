// Skool Tutors email — sends the demo-access email (how-to + limitations + the access code)
// via Google Workspace SMTP. No-op (throws) if SMTP isn't configured.
import nodemailer from 'nodemailer';

const {
  SMTP_USER, SMTP_PASS, SMTP_FROM,
  SMTP_HOST = 'smtp.gmail.com', SMTP_PORT = '587',
} = process.env;

export const mailEnabled = Boolean(SMTP_USER && SMTP_PASS);

let transport = null;
function tx() {
  if (!transport) transport = nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transport;
}

// Email the requester their demo access code + how to use it.
export async function sendDemoAccess(to, name, code, appUrl) {
  if (!mailEnabled) throw new Error('SMTP not configured (SMTP_USER/SMTP_PASS not set)');
  const from = SMTP_FROM || `Skool Tutors <${SMTP_USER}>`;
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const url = (appUrl || 'https://skooltutors.com').replace(/\/$/, '');

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f6f8fc;font-family:'Segoe UI',Arial,sans-serif;color:#1f2733">
  <div style="max-width:560px;margin:0 auto;padding:32px 22px">
    <div style="font-weight:800;font-size:20px;color:#3b6df6">🎓 Skool Tutors</div>
    <h1 style="font-size:25px;margin:16px 0 6px">Your demo access, ${first}</h1>
    <p style="font-size:16px;color:#5b6675;margin:0 0 18px">Thanks for your interest! Here's everything you need to try the live demo.</p>

    <div style="background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:18px 22px;margin:0 0 20px;text-align:center">
      <div style="font-size:13px;color:#5b6675;margin-bottom:6px">Your demo access code</div>
      <div style="font-size:24px;font-weight:800;letter-spacing:2px;color:#1f2733">${String(code || '').replace(/[<>&]/g, '')}</div>
      <a href="${url}" style="display:inline-block;margin-top:14px;background:#3b6df6;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 26px;border-radius:11px">Open the demo →</a>
    </div>

    <p style="font-weight:700;margin:0 0 6px">How to use it (about 2 minutes):</p>
    <p style="margin:6px 0;color:#1f2733">1. Go to <a href="${url}" style="color:#3b6df6">${url.replace(/^https?:\/\//, '')}</a> and enter the code above.</p>
    <p style="margin:6px 0;color:#1f2733">2. <b>Verbal Tutor</b> — pick a sample lesson, then talk or type. It guides the student with questions (never just the answer) and replies out loud.</p>
    <p style="margin:6px 0;color:#1f2733">3. <b>Parent Assistant</b> — ask it to explain a topic so you can help a child. It works in English or Spanish — just speak/type in either.</p>

    <div style="background:#fff7ed;border:1px solid #fde6c8;border-radius:12px;padding:14px 18px;margin:20px 0;color:#7a5b2e;font-size:14px">
      <b>Note:</b> the demo is intentionally limited to a few sample topics — it's just to give you a sense of what the tutor and parent assistant can do. The <b>live school version covers the full K‑12 curriculum</b> and can be <b>customized for your school or program</b> (your subjects, grades, and branding).
    </div>

    <p style="font-size:14px;color:#5b6675">Want the full version for your school, or have questions? Just reply to this email and we'll set up a pilot.</p>
    <p style="font-size:13px;color:#5b6675">— The Skool Tutors Team</p>
  </div></body></html>`;

  const text = `Your Skool Tutors demo access, ${first}

Demo access code: ${code}
Open the demo: ${url}

How to use it:
1. Go to ${url} and enter the code above.
2. Verbal Tutor — pick a sample lesson, then talk or type. It guides with questions, not answers, and replies out loud.
3. Parent Assistant — ask it to explain a topic so you can help a child. Works in English or Spanish.

NOTE: the demo is limited to a few sample topics — just to give you a sense of what it can do. The live school version covers the full K-12 curriculum and can be customized for your school (subjects, grades, branding).

Want the full version or have questions? Reply to this email and we'll set up a pilot.
— The Skool Tutors Team`;

  await tx().sendMail({ from, to, subject: 'Your Skool Tutors demo access 🎓', html, text });
  console.log(`✉ Demo access email sent to ${to}`);
}
