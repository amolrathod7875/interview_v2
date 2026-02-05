export const githubAuth = (req, res, next) => {
  try {
    // 🔍 Cookie must exist (set during OAuth callback)
    const token = req.cookies?.github_token;

    console.log("🔍 GitHub Auth Middleware - Cookies:", req.cookies);
    console.log("🔍 GitHub Token:", token ? "Present" : "Missing");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "GitHub not authenticated. Please connect GitHub.",
      });
    }

    // Attach token for downstream routes
    req.githubToken = token;

    next();
  } catch (err) {
    console.error("❌ GitHub Auth Middleware Error:", err);
    return res.status(500).json({
      success: false,
      message: "GitHub authentication failed",
    });
  }
};
