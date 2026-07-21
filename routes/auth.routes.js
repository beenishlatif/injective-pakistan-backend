// server/routes/auth.routes.js
import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/user.model.js";

const router = express.Router();

const REQUIRED_ENV = [
  "X_CLIENT_ID",
  "X_CLIENT_SECRET",
  "X_CALLBACK_URL",
  "JWT_SECRET",
  "FRONTEND_URL",
];
function getMissingEnv() {
  return REQUIRED_ENV.filter((key) => !process.env[key]);
}
const missingAtLoad = getMissingEnv();
if (missingAtLoad.length > 0) {
  console.error(`[auth.routes] Missing env vars: ${missingAtLoad.join(", ")}`);
}

const pkceStore = new Map();

function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/* Small HTML helper: talks back to the tab that opened this popup via
   postMessage, then closes itself. Falls back to a normal redirect if
   the popup was blocked and this ended up as a full-page navigation. */
function popupResponseHtml({ success, token, message, frontendUrl }) {
  const payload = success
    ? { type: "x-oauth-success", token }
    : { type: "x-oauth-error", message: message || "auth_failed" };
  const fallbackUrl = success
    ? `${frontendUrl}/game?token=${encodeURIComponent(token)}`
    : `${frontendUrl}/game?error=${encodeURIComponent(message || "auth_failed")}`;

  return `<!DOCTYPE html>
<html>
  <body>
    <script>
      (function () {
        var payload = ${JSON.stringify(payload)};
        var targetOrigin = ${JSON.stringify(frontendUrl)};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, targetOrigin);
            window.close();
            return;
          }
        } catch (e) {}
        // No opener (popup blocked / opened directly) -> normal redirect
        window.location.href = ${JSON.stringify(fallbackUrl)};
      })();
    </script>
  </body>
</html>`;
}

// Step A: send the user to X's authorize screen (opened in a popup by the frontend)
router.get("/x/login", (req, res) => {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    console.error(`[x/login] Cannot start OAuth, missing: ${missing.join(", ")}`);
    return res
      .status(500)
      .send(
        popupResponseHtml({
          success: false,
          message: "server_misconfigured",
          frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        })
      );
  }

  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
  const state = base64url(crypto.randomBytes(16));

  pkceStore.set(state, codeVerifier);
  setTimeout(() => pkceStore.delete(state), 10 * 60 * 1000);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID,
    redirect_uri: process.env.X_CALLBACK_URL,
    scope: "tweet.read users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  res.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
});

// Step B: X redirects back here (still inside the popup)
router.get("/x/callback", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;

  try {
    const { code, state, error: xError } = req.query;

    if (xError) {
      return res.send(
        popupResponseHtml({ success: false, message: "auth_denied", frontendUrl })
      );
    }

    const codeVerifier = pkceStore.get(state);
    if (!codeVerifier) {
      return res.send(
        popupResponseHtml({ success: false, message: "invalid_state", frontendUrl })
      );
    }
    pkceStore.delete(state);

    const tokenRes = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.X_CALLBACK_URL,
        code_verifier: codeVerifier,
        client_id: process.env.X_CLIENT_ID,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
            ).toString("base64"),
        },
      }
    );

    const { access_token } = tokenRes.data;

    const profileRes = await axios.get(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const xUser = profileRes.data.data;

    const user = await User.findOneAndUpdate(
      { xId: xUser.id },
      {
        $setOnInsert: { xId: xUser.id },
        $set: {
          username: xUser.username,
          displayName: xUser.name,
          avatar: xUser.profile_image_url,
        },
      },
      { new: true, upsert: true }
    );

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.send(popupResponseHtml({ success: true, token, frontendUrl }));
  } catch (err) {
    console.error("X OAuth callback error:", err?.response?.data || err.message);
    return res.send(
      popupResponseHtml({ success: false, message: "auth_failed", frontendUrl })
    );
  }
});

export default router;