/**
 * utils/community.mailer.js
 * ------------------------------------------------------------------
 * Sends a "new join request" email to the community admin inbox with
 * Accept / Reject buttons. Each button is a plain GET link (so it
 * works from any email client) protected by an HMAC token — nobody
 * can approve/reject a member just by guessing the member's id.
 *
 * Required .env vars:
 *   GMAIL_USER               — the Gmail address that SENDS the email
 *   GMAIL_APP_PASSWORD        — a Gmail "app password" (not your normal
 *                              password — generate one at
 *                              https://myaccount.google.com/apppasswords,
 *                              requires 2-Step Verification to be on)
 *   COMMUNITY_ADMIN_EMAIL      — where join-request emails are sent
 *                              (defaults to beenishlatif1026@gmail.com)
 *   COMMUNITY_ACTION_SECRET    — any long random string, used to sign
 *                              the Accept/Reject links
 *   SERVER_URL                 — your backend's public base URL, e.g.
 *                              http://localhost:5000 in dev, or your
 *                              deployed API URL in production
 *   COMMUNITY_WEBSITE_URL      — your public site URL (used by the
 *                              "Done" button on the result page as a
 *                              fallback destination if the tab can't
 *                              be closed automatically). Defaults to "/".
 * ------------------------------------------------------------------
 */

import nodemailer from "nodemailer";
import crypto from "crypto";

const ADMIN_EMAIL = process.env.COMMUNITY_ADMIN_EMAIL || "beenishlatif1026@gmail.com";
const ACTION_SECRET = process.env.COMMUNITY_ACTION_SECRET || "replace-this-with-a-long-random-string";
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
const WEBSITE_URL = process.env.COMMUNITY_WEBSITE_URL || "/";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ---- Secure tokens for the Accept / Reject links ----
export function generateActionToken(memberId, action) {
  return crypto
    .createHmac("sha256", ACTION_SECRET)
    .update(`${memberId}:${action}`)
    .digest("hex");
}

export function verifyActionToken(memberId, action, token) {
  if (!token) return false;
  const expected = generateActionToken(memberId, action);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(token));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// ---- Themed, responsive result page shown after Accept / Reject ----
// The "Done" button actually does something now: it tries to close the
// browser tab (works when the tab was opened by clicking the email
// link, which is the normal case), and falls back to redirecting to
// the website if the browser refuses to let a script close the tab.
export function actionResultPage(type, message, options = {}) {
  const isSuccess = type === "success";
  const label = isSuccess ? "Request updated" : "Couldn't do that";
  const redirectUrl = options.redirectUrl || WEBSITE_URL;

  const icon = isSuccess
    ? `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
    : `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light dark" />
<title>${escapeHtml(label)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

  :root {
    color-scheme: light dark;
    --bg: #f3f4f6;
    --panel: #ffffff;
    --hairline: #e6e8eb;
    --text: #111318;
    --text-dim: #4b5563;
    --text-faint: #9aa1ab;
    --accent: ${isSuccess ? "#1a9c8b" : "#c0433f"};
    --accent-dim: ${isSuccess ? "rgba(26,156,139,0.1)" : "rgba(192,67,63,0.1)"};
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0d10;
      --panel: #0d1013;
      --hairline: #1d232b;
      --text: #e7eaee;
      --text-dim: #8992a1;
      --text-faint: #545c67;
      --accent: ${isSuccess ? "#47d6c4" : "#e5645f"};
      --accent-dim: ${isSuccess ? "rgba(71,214,196,0.1)" : "rgba(229,100,95,0.1)"};
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
    color: var(--text);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .card {
    width: 100%;
    max-width: 420px;
    padding: 40px 32px 32px;
    border: 1px solid var(--hairline);
    border-radius: 14px;
    background: var(--panel);
    text-align: center;
    animation: pop 0.35s ease;
  }
  @keyframes pop {
    from { opacity: 0; transform: translateY(6px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .icon-wrap {
    width: 60px;
    height: 60px;
    margin: 0 auto 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-dim);
    color: var(--accent);
    border: 1px solid var(--hairline);
  }
  .eyebrow {
    display: block;
    font-family: "IBM Plex Mono", monospace;
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-faint);
    margin-bottom: 10px;
  }
  h1 {
    font-family: "Space Grotesk", "Inter", sans-serif;
    font-size: 19px;
    font-weight: 700;
    margin: 0 0 10px;
    color: var(--text);
  }
  p.msg {
    font-size: 14px;
    line-height: 1.65;
    color: var(--text-dim);
    margin: 0 0 28px;
  }
  button.done {
    width: 100%;
    padding: 13px 0;
    border-radius: 8px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #061412;
    font-family: "IBM Plex Mono", monospace;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  @media (prefers-color-scheme: dark) {
    button.done { color: #061412; }
  }
  button.done:hover { transform: translateY(-1px); opacity: 0.92; }
  button.done:active { transform: translateY(0); }
  .hint {
    margin-top: 14px;
    font-size: 11.5px;
    color: var(--text-faint);
  }
  @media (max-width: 420px) {
    .card { padding: 32px 22px 26px; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">${icon}</div>
    <span class="eyebrow">Injective Pakistan &middot; Community Hub</span>
    <h1>${escapeHtml(label)}</h1>
    <p class="msg">${escapeHtml(message)}</p>
    <button type="button" class="done" id="doneBtn">Done</button>
    <div class="hint" id="hint">This tab will close automatically.</div>
  </div>

  <script>
    (function () {
      var hint = document.getElementById("hint");
      document.getElementById("doneBtn").addEventListener("click", function () {
        // Try to close the tab (works when it was opened by the email link).
        window.open("", "_self");
        window.close();

        // If the browser blocked window.close() (most tabs the user typed a
        // URL into, or already-focused tabs, can't be closed by script),
        // fall back to sending them to the website after a short delay.
        setTimeout(function () {
          if (hint) hint.textContent = "Redirecting…";
          window.location.href = ${JSON.stringify(redirectUrl)};
        }, 400);
      });
    })();
  </script>
</body>
</html>`;
}

// ---- The actual notification email ----
export async function sendJoinRequestEmail(member) {
  const approveToken = generateActionToken(member._id, "approve");
  const rejectToken = generateActionToken(member._id, "reject");

  const approveUrl = `${SERVER_URL}/api/community/members/${member._id}/approve?token=${approveToken}`;
  const rejectUrl = `${SERVER_URL}/api/community/members/${member._id}/reject?token=${rejectToken}`;

  const submittedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const row = (label, value, isLast) => `
    <tr>
      <td class="cm-row${isLast ? " cm-row-last" : ""}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="cm-label" width="110">${escapeHtml(label)}</td>
            <td class="cm-value">${value ? escapeHtml(value) : "<span class=\"cm-empty\">—</span>"}</td>
          </tr>
        </table>
      </td>
    </tr>`;

  // Table-based layout (safest across Gmail/Outlook/Apple Mail) with a
  // <style> block for real responsiveness and a full dark/light theme
  // that follows the recipient's mail client / OS automatically.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>New community join request</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; padding:0; background:#f3f4f6; }
  .cm-bg { background:#f3f4f6; padding:32px 12px; }
  .cm-card { max-width:500px; margin:0 auto; background:#ffffff; border:1px solid #e6e8eb; border-radius:14px; overflow:hidden; }
  .cm-accent-bar { height:4px; line-height:4px; font-size:0; background:linear-gradient(90deg,#1a9c8b,#e8a33d); }
  .cm-header { padding:22px 26px 18px; border-bottom:1px solid #e6e8eb; }
  .cm-eyebrow { font-family:-apple-system,Segoe UI,Inter,sans-serif; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:#1a9c8b; }
  .cm-header-title { font-family:-apple-system,Segoe UI,Inter,sans-serif; font-size:19px; font-weight:700; color:#111318; margin:8px 0 0; }
  .cm-timestamp { font-family:-apple-system,Segoe UI,Inter,sans-serif; font-size:11.5px; color:#9aa1ab; margin-top:6px; }
  .cm-body { padding:22px 26px 6px; font-family:-apple-system,Segoe UI,Inter,sans-serif; }
  .cm-intro { font-size:13.5px; color:#4b5563; margin:0 0 18px; line-height:1.6; }
  .cm-fields { border:1px solid #eceef0; border-radius:10px; overflow:hidden; }
  .cm-row { padding:12px 16px; border-bottom:1px solid #eceef0; background:#fafbfc; }
  .cm-row-last { border-bottom:none; }
  .cm-label { font-family:"Courier New",monospace; font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; color:#9aa1ab; vertical-align:top; padding-top:1px; }
  .cm-value { font-size:13.5px; color:#1a1d21; line-height:1.5; }
  .cm-empty { color:#c2c7cd; }
  .cm-btns { width:100%; margin:24px 0 4px; }
  .cm-btn-spacer { height:10px; line-height:10px; font-size:0; }
  .cm-btn {
    display:block; width:100%; text-align:center; text-decoration:none; font-weight:700; font-size:14px;
    padding:15px 0; border-radius:9px; font-family:-apple-system,Segoe UI,Inter,sans-serif; letter-spacing:.01em;
  }
  .cm-approve { background:#1a9c8b; color:#ffffff !important; }
  .cm-reject { background:#ffffff; color:#c0433f !important; border:1.5px solid #c0433f; }
  .cm-btn-icon { margin-right:6px; }
  .cm-footer { padding:16px 26px 24px; font-family:-apple-system,Segoe UI,Inter,sans-serif; font-size:11px; color:#9aa1ab; border-top:1px solid #f0f1f3; margin-top:6px; }
  .cm-footer a { color:#9aa1ab; }

  /* Dark mode: applies automatically in clients/OS that support it (Apple Mail, Outlook for iOS, Gmail app on some devices) */
  @media (prefers-color-scheme: dark) {
    .cm-bg { background:#0b0d10 !important; }
    .cm-card { background:#0d1013 !important; border-color:#1d232b !important; }
    .cm-header { border-color:#1d232b !important; }
    .cm-header-title { color:#e7eaee !important; }
    .cm-timestamp { color:#545c67 !important; }
    .cm-intro { color:#8992a1 !important; }
    .cm-fields { border-color:#1d232b !important; }
    .cm-row { background:#101318 !important; border-color:#1d232b !important; }
    .cm-label { color:#545c67 !important; }
    .cm-value { color:#e7eaee !important; }
    .cm-empty { color:#3a414c !important; }
    .cm-reject { background:transparent !important; }
    .cm-footer { color:#545c67 !important; border-color:#171b21 !important; }
    .cm-footer a { color:#545c67 !important; }
  }

  @media (max-width: 480px) {
    .cm-header, .cm-body, .cm-footer { padding-left:18px !important; padding-right:18px !important; }
  }
</style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cm-bg">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cm-card">
        <tr><td class="cm-accent-bar">&nbsp;</td></tr>
        <tr><td class="cm-header">
          <span class="cm-eyebrow">Injective Pakistan &middot; Community Hub</span>
          <h2 class="cm-header-title">New join request</h2>
          <div class="cm-timestamp">Submitted ${escapeHtml(submittedAt)}</div>
        </td></tr>
        <tr><td class="cm-body">
          <p class="cm-intro">Someone applied to join the community. Review the details below and accept or reject the request — no login needed.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cm-fields">
            ${row("Name", member.name)}
            ${row("Email", member.email)}
            ${row("City", member.city)}
            ${row("Telegram", member.telegramHandle)}
            ${row("Message", member.bio, true)}
          </table>

          <!-- Buttons are always stacked (full-width, one above the other) so they
               render correctly in every mail client, including Gmail's mobile app,
               which does not reliably support @media queries for side-by-side layouts. -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cm-btns">
            <tr><td>
              <a href="${approveUrl}" class="cm-btn cm-approve">&#10003;&nbsp; Accept</a>
            </td></tr>
            <tr><td class="cm-btn-spacer">&nbsp;</td></tr>
            <tr><td>
              <a href="${rejectUrl}" class="cm-btn cm-reject">&#10005;&nbsp; Reject</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="cm-footer">
          This is an automated notification from the Community Hub join form.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Injective Pakistan Hub" <${process.env.GMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: `New community join request — ${member.name}`,
    html,
  });
}