import {
  LayoutGrid,
  LogOut,
  Zap,
  Code,
  Briefcase,
  BookOpen,
} from "lucide-react"

import { useEffect, useState } from "react"
import { RiRobot3Line } from "react-icons/ri"
import { MdOutlineFindInPage, MdOutlineQuiz } from "react-icons/md"
import { FaRegUser } from "react-icons/fa6"
import { FcMenu } from "react-icons/fc"
import {
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom"
import axios from "axios"

import AiInterviewForm from "./aiInterviewForm"
import { logoutUser } from "@/services/authService"
import InterviewCards from "./interviewCards"
import InterviewQuizForm from "./interviewQuizForm"
import QuizCards from "./quizCards"
import OverviewDashboard from "./overviewDashboard"
import AnalyseResume from "./analyseResume"
import Profile from "./profile"
import Roadmap from "./roadmap"
import JobBoard from "./jobTracker/Board"

const API = import.meta.env.VITE_API_BASE_URL

/* ================= SIDEBAR ITEMS ================= */

const navItems = [
  { label: "Overview", icon: LayoutGrid, type: "tab" },
  { label: "Mock Interview", icon: RiRobot3Line, type: "tab" },
  { label: "Quiz", icon: MdOutlineQuiz, type: "tab" },
  { label: "CodeX", icon: Code, type: "route", path: "/codex" },
  { label: "Job Tracker", icon: Briefcase, type: "tab" },
  { label: "Study Companion", icon: BookOpen, type: "route", path: "/study" },
  { label: "Analyse Resume", icon: MdOutlineFindInPage, type: "tab" },
  { label: "Roadmap", icon: MdOutlineFindInPage, type: "tab" },
  { label: "Profile", icon: FaRegUser, type: "tab" },
]

const AfterLoginLayout = ({ theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState("Overview")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  const tab = location.state?.tab
  const isStudyRoute = location.pathname === "/study"
  const firebaseId = localStorage.getItem("userUid")

  // Fetch user profile for avatar
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API}/user/me`, {
          params: { firebaseId },
        })
        setUser(res.data.data)
      } catch (err) {
        console.error("Failed to fetch user:", err)
      }
    }

    if (firebaseId) fetchUser()
  }, [firebaseId])

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
      window.history.replaceState({}, document.title)
    }
  }, [tab])

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [activeTab, location.pathname])

  const handleLogout = async () => {
    await logoutUser()
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">

      {/* Hover trigger */}
      <div
        className="fixed inset-y-0 left-0 w-4 z-[60]"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      {/* Toggle button - visible always for click-to-toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-[70] p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
      >
        <FcMenu className="w-5 h-5" />
      </button>

      {/* Top Navigation Bar with Profile */}
      <header className="fixed top-0 right-0 left-0 z-40 bg-card border-b border-border shadow-subtle">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 ml-14">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">Interview.io</span>
          </div>
          
          <button
            onClick={() => setActiveTab("Profile")}
            className="flex items-center gap-3 hover:bg-muted rounded-full pr-4 pl-1 py-1 transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">View Profile</p>
            </div>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-card
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="px-5 py-5 flex items-center gap-3 border-b border-border">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-foreground">Interview.io</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.type === "route") {
                    navigate(item.path)
                  } else {
                    setActiveTab(item.label)
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative
                ${
                  activeTab === item.label && !isStudyRoute
                    ? "bg-primary/15 text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-primary before:rounded-r-full"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.label ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      {/* FIXED: Removed flex-1 and used w-full to allow full-width grid layouts in children */}
      <main className="w-full min-h-screen overflow-x-hidden pt-16">
        {isStudyRoute ? (
          <Outlet />
        ) : (
          <div className="w-full h-full">
            {activeTab === "Overview" && <OverviewDashboard />}

            {activeTab === "Mock Interview" && (
              <div className="flex flex-col lg:flex-row min-h-screen w-full">
                <div className="w-full lg:w-1/2 p-4"><AiInterviewForm /></div>
                <div className="w-full lg:w-1/2 p-4"><InterviewCards /></div>
              </div>
            )}

            {activeTab === "Quiz" && (
              <div className="flex flex-col lg:flex-row min-h-screen w-full">
                <div className="w-full lg:w-1/2 p-4"><InterviewQuizForm /></div>
                <div className="w-full lg:w-1/2 p-4"><QuizCards /></div>
              </div>
            )}

            {activeTab === "Analyse Resume" && <AnalyseResume />}
            {activeTab === "Roadmap" && <Roadmap />}
            {activeTab === "Profile" && (
              <Profile theme={theme} toggleTheme={toggleTheme} />
            )}
            {activeTab === "Job Tracker" && <JobBoard />}
          </div>
        )}
      </main>
    </div>
  )
}

export default AfterLoginLayout