import express from "express"
import axios from "axios"
import crypto from "crypto"

const router = express.Router()

// Store tokens temporarily in memory (in production, use Redis or DB)
const tokenStore = new Map()

router.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user repo",
  })

  res.redirect(`https://github.com/login/oauth/authorize?${params}`)
})

router.get("/github/callback", async (req, res) => {
  const { code } = req.query

  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    )

    const accessToken = tokenRes.data.access_token

    // Generate a session ID
    const sessionId = crypto.randomBytes(32).toString('hex')
    
    // Store token with session ID (expires in 1 hour)
    tokenStore.set(sessionId, {
      token: accessToken,
      expires: Date.now() + 60 * 60 * 1000
    })

    const isProduction = process.env.NODE_ENV === "production";
    
    console.log("🍪 Setting session cookie - Production:", isProduction);
    console.log("🔑 Session ID:", sessionId);
    
    // Set session ID in cookie
    res.cookie("gh_session", sessionId, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/",
    })

    console.log("✅ Session set, redirecting to:", `${process.env.FRONTEND_URL}/github-repos`);
    
    res.redirect(`${process.env.FRONTEND_URL}/github-repos`)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "GitHub OAuth failed" })
  }
})

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, data] of tokenStore.entries()) {
    if (data.expires < now) {
      tokenStore.delete(sessionId)
      console.log("🗑️ Cleaned up expired session:", sessionId)
    }
  }
}, 10 * 60 * 1000) // Every 10 minutes

export { tokenStore }
export default router
