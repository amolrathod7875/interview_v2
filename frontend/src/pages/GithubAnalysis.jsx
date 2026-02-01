import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { FaGithub } from "react-icons/fa"
import LoadingWave from "../components/ui/LoadingWave"

const API = import.meta.env.VITE_API_BASE_URL

const GithubAnalysis = () => {
  const [repo, setRepo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  /* ===============================
     Fetch connected repo
  =============================== */
  useEffect(() => {
    const fetchRepo = async () => {
      try {
        const firebaseId = localStorage.getItem("userUid")

        const res = await axios.get(`${API}/user/me`, {
          params: { firebaseId },
          withCredentials: true,
        })

        setRepo(res.data.data.github)
      } catch (err) {
        console.error(err)
        setError("Failed to load GitHub repository")
      } finally {
        setLoading(false)
      }
    }

    fetchRepo()
  }, [])

  /* ===============================
     Run AI Analysis
  =============================== */
  const startAnalysis = async () => {
    try {
      setAnalyzing(true)
      setError(null)
      setAnalysis(null)

      const firebaseId = localStorage.getItem("userUid")

      const res = await axios.post(
        `${API}/api/ai/github/analyze`, // ✅ FIXED PATH
        {
          owner: repo.owner,
          repo: repo.repo,
          firebaseId,
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!res.data?.success) {
        throw new Error("Analysis failed")
      }

      setAnalysis(res.data)
    } catch (err) {
      console.error("Analysis error:", err)
      
      if (err.response?.status === 401) {
        setError("GitHub authentication required. Please reconnect your GitHub account from the dashboard.")
      } else {
        setError("GitHub analysis failed. Please try again.")
      }
    } finally {
      setAnalyzing(false)
    }
  }

  /* ===============================
     STATES
  =============================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingWave />
      </div>
    )
  }

  if (!repo?.connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No GitHub repository connected.</p>
      </div>
    )
  }

  const techStack = analysis?.techStack || {
    languages: [],
    frameworks: [],
    domain: [],
  }

  /* ===============================
     UI
  =============================== */
  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-black">
            GitHub Repository Analysis
          </h1>
          <p className="text-gray-500 mt-1">
            AI-powered insights from your real project
          </p>
        </div>

        {/* CONNECTED REPO */}
        <div className="bg-white border rounded-xl p-6 flex items-center gap-4">
          <FaGithub className="text-black text-3xl" />
          <div>
            <p className="text-sm text-gray-500">Connected Repository</p>
            <p className="font-semibold text-black">
              {repo.owner}/{repo.repo}
            </p>
          </div>
        </div>

        {/* ACTION */}
        {!analysis && (
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">What will be analyzed?</h2>

            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Project structure & intent</li>
              <li>Detected tech stack</li>
              <li>Resume-ready bullet points</li>
              <li>Project-based interview questions</li>
            </ul>

            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={startAnalysis}
              disabled={analyzing}
            >
              {analyzing ? "Analyzing…" : "Start Analysis"}
            </Button>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>
        )}

        {/* AI RESULT */}
        {analysis && (
          <>
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Project Summary</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {analysis.projectSummary}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Tech Stack</h2>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                {techStack.languages.map(l => (
                  <li key={l}>Language: {l}</li>
                ))}
                {techStack.frameworks.map(f => (
                  <li key={f}>Framework: {f}</li>
                ))}
                {techStack.domain.map(d => (
                  <li key={d}>Domain: {d}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">
                Resume Bullet Points
              </h2>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                {analysis.resumeBulletPoints?.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">
                Interview Questions
              </h2>
              <ul className="list-decimal ml-6 text-gray-700 space-y-1">
                {analysis.interviewQuestions?.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default GithubAnalysis
