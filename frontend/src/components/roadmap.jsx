import axios from "axios"
import { useState } from "react"
import LoadingWave from "./ui/LoadingWave"
import RoadmapTimeline from "./ui/RoadmapTimeline"
import QuizModal from "./ui/QuizModal"
import EmptyState from "./ui/EmptyState"
import { Compass, CheckCircle } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

const getOrCreateRoadmapUserId = () => {
  const primaryId = localStorage.getItem("userUid")
  if (primaryId) return primaryId

  const existingGuestId = localStorage.getItem("roadmapGuestId")
  if (existingGuestId) return existingGuestId

  const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem("roadmapGuestId", newGuestId)
  return newGuestId
}

// Clean formatter for hover content
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
          <div className="mt-2 font-semibold text-foreground">
            Resources:
          </div>
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <span>•</span>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline break-all"
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
  const [fromCache, setFromCache] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setRoadmap(null)
    setFromCache(false)
    const roadmapUserId = getOrCreateRoadmapUserId()

    try {
      // Try using GET endpoint first (supports caching)
      const res = await axios.get(`${API}/roadmap/${encodeURIComponent(topic)}`, {
        params: { userId: roadmapUserId }
      })

      if (!res.data.success) {
        throw new Error("Failed to fetch roadmap")
      }

      setRoadmap(res.data.data.roadmap || res.data.data)
      setFromCache(res.data.cached || false)
      
      // Show cache status in console
      if (res.data.cached) {
        console.log("[ROADMAP] Roadmap loaded from Oracle cache!")
      }
    } catch {
      // Fallback to POST if GET fails
      try {
        const postRes = await axios.post(`${API}/roadmap/add`, {
          topic,
          userId: roadmapUserId,
        })

        if (!postRes.data.success) {
          throw new Error("Failed to generate roadmap")
        }

        setRoadmap(postRes.data.data.roadmap)
        setFromCache(postRes.data.cached || false)
      } catch (postErr) {
        setError(
          postErr.response?.data?.message ||
          postErr.message ||
          "Something went wrong"
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!roadmap) return 0
    const levels = ['beginner', 'intermediate', 'advanced']
    let total = 0
    let completed = 0
    levels.forEach(level => {
      const items = roadmap[level] || []
      items.forEach(item => {
        total++
        if (item.completed) completed++
      })
    })
    return total === 0 ? 0 : Math.round((completed / total) * 100)
  }

  // Handle item click - open quiz for uncompleted items, show score for completed
  const handleItemClick = (item, level) => {
    if (item.completed) {
      // Show score if already completed
      alert(`Quiz Score: ${item.quizScore}%`)
      return
    }
    setSelectedItem({ ...item, level, roadmapId: roadmap._id })
    setIsQuizModalOpen(true)
  }

  // Handle quiz completion - update local state
  const handleQuizComplete = (updatedItem) => {
    if (!updatedItem || !roadmap) return
    
    const { level, _id, completed, quizScore } = updatedItem
    setRoadmap(prev => {
      if (!prev) return prev
      const updatedRoadmap = { ...prev }
      const levelItems = updatedRoadmap[level] || []
      const itemIndex = levelItems.findIndex(item => item._id === _id)
      
      if (itemIndex !== -1) {
        updatedRoadmap[level] = [...levelItems]
        updatedRoadmap[level][itemIndex] = {
          ...updatedRoadmap[level][itemIndex],
          completed,
          quizScore
        }
      }
      return updatedRoadmap
    })
  }

  // TIMELINE STRUCTURE
  const roadmapLevels = roadmap
    ? [
        { title: "Beginner", items: roadmap.beginner || [] },
        { title: "Intermediate", items: roadmap.intermediate || [] },
        { title: "Advanced", items: roadmap.advanced || [] },
      ]
    : []

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <LoadingWave />
        <p className="text-muted-foreground text-sm">
          Generating roadmap...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Learning Roadmap
          </h1>
          <p className="text-muted-foreground">
            Generate a structured learning path for any topic
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="DevOps, Node.js, Machine Learning"
              className="flex-1 bg-background text-foreground px-4 py-3 rounded-lg border border-border
              focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-white dark:bg-card border border-gray-300 dark:border-orange-500/40 text-black dark:text-orange-400 font-medium transition hover:bg-gray-100 dark:hover:bg-orange-500/10 disabled:opacity-50"
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

        {/* Cache Indicator */}
        {fromCache && roadmap && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
            <span>Loaded from cache (Oracle Cloud) - No API cost!</span>
          </div>
        )}

        {/* Progress Bar */}
        {roadmap && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Your Progress</span>
              <span className="text-sm font-bold text-primary">{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Complete quizzes to mark items as done</span>
            </div>
          </div>
        )}

        {/* TIMELINE ROADMAP */}
        {roadmap && (
          <RoadmapTimeline
            levels={roadmapLevels}
            formatHoverContent={formatHoverContent}
            onItemClick={handleItemClick}
          />
        )}

        {/* Empty State */}
        {!roadmap && !loading && (
          <EmptyState
            icon={Compass}
            title="No roadmap generated yet"
            description="Enter a topic above and generate a structured learning roadmap with beginner, intermediate, and advanced levels."
          />
        )}

        {/* Quiz Modal */}
        {isQuizModalOpen && selectedItem && (
          <QuizModal
            item={selectedItem}
            topic={topic}
            onClose={() => {
              setIsQuizModalOpen(false)
              setSelectedItem(null)
            }}
            onComplete={handleQuizComplete}
          />
        )}

      </div>
    </div>
  )
}

export default Roadmap
