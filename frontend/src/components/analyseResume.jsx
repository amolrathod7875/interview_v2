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
      const existing = await axios.get(`http://localhost:3000/buildResume/${userId}`)

      if (existing.data.length === 0) {
        await axios.post('http://localhost:3000/buildResume/', {
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
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <LoadingWave />
        <p className="text-gray-600">{messages[msgIndex]}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ================= LEFT: Upload ================= */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
            id="resumeUpload"
          />

          <label
            htmlFor="resumeUpload"
            className="border-2 border-dashed rounded-xl p-8 block text-center cursor-pointer"
          >
            {file ? file.name : "Drag & drop or click to upload"}
          </label>

          <button
            onClick={handleUpload}
            disabled={!file}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Upload and Analyze
          </button>
        </div>

        {/* ================= RIGHT: Result / History ================= */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm overflow-y-auto max-h-[80vh]">

          {/* ---- Current Analysis ---- */}
          {resume && (
            <>
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">Analysis Result</h2>
                <Button className={'bg-blue-600 hover:bg-blue-700 cursor-pointer'} onClick={handleBuildResume}>Build ATS Friendly Resume</Button>
              </div>

              <div className="flex justify-center mb-6">
                <ScoreCircle score={resume.score} size={140} />
              </div>

              <div className="mb-4 text-sm whitespace-pre-wrap">
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
                <p className="text-gray-500">
                  No previous resumes analyzed.
                </p>
              )}

              <ul className="space-y-3">
                {history.map((r) => (
                  <li
                    key={r._id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setResume(r)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{r.fileName}</span>
                      <span className="text-sm">Score: {r.score}</span>
                    </div>
                    <div className="text-xs text-gray-400">
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
