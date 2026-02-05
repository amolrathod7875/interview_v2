import express from "express"
import axios from "axios"

const router = express.Router()

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

    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("github_token", accessToken, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.redirect(`${process.env.FRONTEND_URL}/github-repos`)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "GitHub OAuth failed" })
  }
})

export default router
