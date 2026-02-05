import { tokenStore } from "../routes/githubAuth.routes.js";

export const githubAuth = (req, res, next) => {
  try {
    // Get session ID from cookie
    const sessionId = req.cookies?.gh_session;

    console.log("🔍 GitHub Auth Middleware - Cookies:", req.cookies);
    console.log("🔍 Session ID:", sessionId ? "Present" : "Missing");

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "GitHub not authenticated. Please connect GitHub.",
      });
    }

    // Get token from session store
    const sessionData = tokenStore.get(sessionId);

    if (!sessionData || sessionData.expires < Date.now()) {
      tokenStore.delete(sessionId);
      return res.status(401).json({
        success: false,
        message: "GitHub session expired. Please reconnect.",
      });
    }

    console.log("✅ GitHub token found from session");

    // Attach token for downstream routes
    req.githubToken = sessionData.token;

    next();
  } catch (err) {
    console.error("❌ GitHub Auth Middleware Error:", err);
    return res.status(500).json({
      success: false,
      message: "GitHub authentication failed",
    });
  }
};
