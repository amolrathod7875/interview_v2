import { useState, useEffect } from "react"
import axios from "axios"
import { FaGithub, FaCheck, FaExchangeAlt } from "react-icons/fa"
import LoadingWave from "../ui/LoadingWave"

const API = import.meta.env.VITE_API_BASE_URL

// Convert escaped newline sequences like "\\n" into real newlines
const sanitize = (text) => {
  if (typeof text !== 'string') return text
  // replace escaped CRLF or LF with actual newline, and escaped tabs
  return text.replace(/\\r?\\n/g, '\n').replace(/\\t/g, '\t')
}

const GithubAnalysisCard = () => {
  const [step, setStep] = useState("initial") // initial, repos, analyzing, results
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check if GitHub is already connected
  useEffect(() => {
    const checkGithubConnection = async () => {
      try {
        const firebaseId = localStorage.getItem("userUid")
        const res = await axios.get(`${API}/user/me`, {
          params: { firebaseId },
        })

        if (res.data.data?.github?.connected) {
          // Already connected, fetch repos
          fetchRepos()
        }
      } catch (err) {
        console.error("Failed to check GitHub connection:", err)
      }
    }

    checkGithubConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connectGithub = () => {
    window.location.href = `${API}/auth/github`
  }

  const fetchRepos = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API}/api/github/repos`, {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to fetch repositories")
      }

      const data = await res.json()
      setRepos(data)
      setStep("repos")
    } catch (err) {
      console.error("Repo fetch failed:", err)
      setError("Failed to load repositories. Please reconnect GitHub.")
    } finally {
      setLoading(false)
    }
  }

  const selectRepo = async (repo) => {
    try {
      setLoading(true)
      setSelectedRepo(repo)

      // Save selected repo to backend
      await axios.post(`${API}/user/github/repo`, {
        firebaseId: localStorage.getItem("userUid"),
        owner: repo.owner,
        repo: repo.name,
      })

      setStep("selected")
    } catch (err) {
      console.error("Failed to save repo:", err)
      setError("Failed to save selected repository")
    } finally {
      setLoading(false)
    }
  }

  const analyzeRepo = async () => {
    try {
      setLoading(true)
      setError(null)
      setStep("analyzing")

      const res = await axios.post(
        `${API}/api/ai/github/analyze`,
        {
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
        },
        { withCredentials: true }
      )

      if (res.data?.success) {
        setAnalysis(res.data)
        setStep("results")
      } else {
        throw new Error("Analysis failed")
      }
    } catch (err) {
      console.error("Analysis error:", err)
      setError(
        err.response?.status === 401
          ? "GitHub authentication required. Please reconnect."
          : "Analysis failed. Please try again."
      )
      setStep("selected")
    } finally {
      setLoading(false)
    }
  }

  const changeRepo = () => {
    setSelectedRepo(null)
    setAnalysis(null)
    setStep("repos")
  }

  // INITIAL: Login with GitHub
  if (step === "initial") {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <FaGithub className="text-4xl" />
          <div>
            <h3 className="text-2xl font-bold">GitHub Repository Analysis</h3>
            <p className="text-gray-300 text-sm">
              Analyze your projects for resume bullets & interview prep
            </p>
          </div>
        </div>

        <button
          onClick={connectGithub}
          className="mt-6 w-full bg-white text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
        >
          <FaGithub />
          Login with GitHub
        </button>
      </div>
    )
  }

  // REPOS: Select a repository
  if (step === "repos") {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Select a Repository
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingWave />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {repos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => selectRepo(repo)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {repo.owner}/{repo.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {repo.description || "No description"}
                    </p>
                  </div>
                  {repo.private && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    )
  }

  // SELECTED: Analyze or Change Repo
  if (step === "selected") {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <FaGithub className="text-3xl text-gray-900" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {selectedRepo.owner}/{selectedRepo.name}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedRepo.description || "No description"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={analyzeRepo}
            disabled={loading}
            className="py-4 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                Analyzing...
              </>
            ) : (
              <>
                <FaCheck />
                Analyze Repository
              </>
            )}
          </button>

          <button
            onClick={changeRepo}
            disabled={loading}
            className="py-4 px-6 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaExchangeAlt />
            Change Repository
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    )
  }

  // ANALYZING: Loading state
  if (step === "analyzing") {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200">
        <div className="flex flex-col items-center justify-center text-center">
          <LoadingWave />
          <h3 className="text-2xl font-bold text-gray-900 mb-2 mt-6">
            Analyzing Repository...
          </h3>
          <p className="text-gray-500">
            This may take a few moments. We're analyzing your project structure,
            tech stack, and generating insights.
          </p>
        </div>
      </div>
    )
  }

  // RESULTS: Show analysis
  if (step === "results" && analysis) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <FaGithub className="text-3xl text-gray-900" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {analysis.repo}
              </h3>
              <p className="text-sm text-green-600 font-medium">
                Analysis Complete
              </p>
            </div>
          </div>
          <button
            onClick={changeRepo}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Change Repository
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. Project Summary */}
          <Section title="Project Summary">
            <p className="text-gray-700 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {analysis.projectSummary ? sanitize(analysis.projectSummary) : "No summary available"}
            </p>
          </Section>

          {/* 2. Tech Stack */}
          <Section title="Tech Stack Used">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.techStack?.languages?.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.techStack.languages.map((lang, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.techStack?.frameworks?.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Frameworks</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.techStack.frameworks.map((fw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.techStack?.domain?.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Domain</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.techStack.domain.map((dom, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {dom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* 3. Resume Bullet Points */}
          <Section title="Resume Bullet Points">
            {analysis.resumeBulletPoints?.length > 0 ? (
              <ul className="space-y-2">
                {analysis.resumeBulletPoints.map((bullet, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{sanitize(bullet)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No bullet points generated</p>
            )}
          </Section>

          {/* 4. Interview Questions */}
          <Section title="Interview Questions">
            {analysis.interviewQuestions?.length > 0 ? (
              <ol className="space-y-3">
                {analysis.interviewQuestions.map((question, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-[24px]">
                      {i + 1}.
                    </span>
                    <span className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{sanitize(question)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500">No questions generated</p>
            )}
          </Section>

          {/* 5. Key Improvements */}
          {analysis.keyImprovements && (
            <Section title="Key Improvements">
              <p className="text-gray-700 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                {sanitize(analysis.keyImprovements)}
              </p>
            </Section>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t flex gap-4">
          <button
            onClick={analyzeRepo}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Re-analyze
          </button>
          <button
            onClick={changeRepo}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Select Different Repository
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Helper component for sections
const Section = ({ title, children }) => (
  <div className="bg-gray-50 rounded-lg p-6">
    <h4 className="text-lg font-bold text-gray-900 mb-3">{title}</h4>
    {children}
  </div>
)

export default GithubAnalysisCard
