import { useEffect, useState } from "react"
import ScoreCircle from "./ui/scoreCircle"
import LoadingWave from "./ui/LoadingWave"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const API = import.meta.env.VITE_API_BASE_URL

const messages = [
  "Parsing resume...",
  "Analyzing with ATS...",
  "Generating feedback...",
  "Almost done..."
]

const AnalyseResume = () => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resume, setResume] = useState(null)
  const [history, setHistory] = useState([])
  const [msgIndex, setMsgIndex] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const userId = localStorage.getItem("userUid")
  const navigate = useNavigate()

  /* ---------------- Fetch previous resumes ---------------- */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/resume/scores/${userId}`)
        setHistory(res.data.resumes || [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchHistory()
  }, [])

  /* ---------------- Upload ---------------- */
  const handleUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append("resume", file)
    formData.append("userId", userId)

    try {
      setLoading(true)
      const res = await axios.post(`${API}/resume/upload`, formData)
      setResume(res.data.resume)
      setHistory((prev) => [res.data.resume, ...prev])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- Build Resume ---------------- */
  const handleBuildResume = async () => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      const existing = await axios.get(`${API}/buildResume/${userId}`)

      if (existing.data.length === 0) {
        await axios.post(`${API}/buildResume/`, {
          userId: resume.userId,
          fileUrl: resume.fileUrl,
          fileName: resume.fileName,
          fileType: resume.fileType,
          fileSize: resume.fileSize,
          extractedText: resume.extractedText,
          score: resume.score,
          improvements: resume.improvements,
          feedback: resume.feedback
        })
      }

      navigate('/buildresume')
    } catch (e) {
      console.error(e)
    }
  }

  /* ---------------- Loading messages ---------------- */
  useEffect(() => {
    if (!loading || msgIndex >= messages.length - 1) return
    const timer = setTimeout(() => setMsgIndex(i => i + 1), 2500)
    return () => clearTimeout(timer)
  }, [loading, msgIndex])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <LoadingWave />
        <p className="text-muted-foreground">{messages[msgIndex]}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10">
      {/* Back to Dashboard */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Dashboard
      </button>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ================= LEFT: Upload ================= */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl text-foreground font-semibold mb-4">Upload Resume</h2>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
            id="resumeUpload"
          />

          <label
            htmlFor="resumeUpload"
            className="border-2 border-dashed border-border text-muted-foreground rounded-xl p-8 block text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {file ? file.name : "Drag & drop or click to upload"}
          </label>

          <button
            onClick={handleUpload}
            disabled={!file}
            className="w-full mt-6 py-3 rounded-lg bg-white dark:bg-card border border-gray-300 dark:border-orange-500/40 text-black dark:text-orange-400 font-medium transition hover:bg-gray-100 dark:hover:bg-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload and Analyze
          </button>
        </div>

        {/* ================= RIGHT: Result / History ================= */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm overflow-y-auto max-h-[80vh]">

          {/* ---- Current Analysis ---- */}
          {resume && (
            <>
              <div className="flex justify-between mb-4">
                <h2 className="text-xl text-foreground font-semibold">Analysis Result</h2>
                <Button
                  className={"bg-white dark:bg-card border border-gray-300 dark:border-orange-500/40 text-black dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-orange-500/10 cursor-pointer"}
                  onClick={handleBuildResume}
                >
                  Build ATS Friendly Resume
                </Button>
              </div>

              <div className="flex justify-center mb-6">
                <ScoreCircle score={resume.score} size={140} />
              </div>

              <div className="mb-4 text-sm text-foreground whitespace-pre-wrap">
                {resume.feedback}
              </div>
            </>
          )}

          {/* ---- History ---- */}
          {!resume && (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Previously Analyzed
              </h2>

              {history.length === 0 && (
                <p className="text-muted-foreground">
                  No previous resumes analyzed.
                </p>
              )}

              <ul className="space-y-3">
                {history.map((r) => (
                  <li
                    key={r._id}
                    className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setResume(r)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">{r.fileName}</span>
                      <span className="text-sm text-muted-foreground">Score: {r.score}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default AnalyseResume
