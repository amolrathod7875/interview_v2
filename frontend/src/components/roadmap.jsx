import axios from "axios"
import { useState } from "react"
import LoadingWave from "./ui/LoadingWave"
import RoadmapTimeline from "./ui/RoadmapTimeline"

const API = "http://localhost:3000"

// ✅ Clean formatter for hover content
const formatHoverContent = (text) => {
  if (!text) return null

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)

  const content = []
  const links = []

  sentences.forEach((sentence) => {
    if (sentence.includes("http")) {
      sentence.split(/\s+/).forEach((word) => {
        if (word.startsWith("http")) {
          links.push(word.replace(/[),.]+$/, ""))
        }
      })
    } else {
      content.push(sentence)
    }
  })

  return (
    <div className="space-y-2">
      {content.map((line, i) => (
        <div key={i} className="flex gap-2">
          <span>•</span>
          <span>{line}</span>
        </div>
      ))}

      {links.length > 0 && (
        <>
          <div className="mt-2 font-semibold text-gray-700">
            Resources:
          </div>
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <span>•</span>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {link}
              </a>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const Roadmap = () => {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [roadmap, setRoadmap] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setRoadmap(null)

    try {
      const res = await axios.post(`${API}/roadmap/add`, {
        topic,
        userId: localStorage.getItem("userUid"),
      })

      if (!res.data.success) {
        throw new Error("Failed to generate roadmap")
      }

      setRoadmap(res.data.data.roadmap)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Something went wrong"
      )
    } finally {
      setLoading(false)
    }
  }

  // ✅ TIMELINE STRUCTURE
  const roadmapLevels = roadmap
    ? [
        { title: "Beginner", items: roadmap.beginner || [] },
        { title: "Intermediate", items: roadmap.intermediate || [] },
        { title: "Advanced", items: roadmap.advanced || [] },
      ]
    : []

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
        <LoadingWave />
        <p className="text-gray-600 text-sm">
          Generating roadmap...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Learning Roadmap
          </h1>
          <p className="text-gray-500">
            Generate a structured learning path for any topic
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="DevOps, Node.js, Machine Learning"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Generate Roadmap
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
            {error}
          </div>
        )}

        {/* ✅ TIMELINE ROADMAP */}
        {roadmap && (
          <RoadmapTimeline
            levels={roadmapLevels}
            formatHoverContent={formatHoverContent}
          />
        )}

        {/* Empty State */}
        {!roadmap && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              Enter a topic above to generate your learning roadmap.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default Roadmap
