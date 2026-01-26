import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutGrid,
  LogOut,
  Zap,
  Code   // ✅ FIXED (capital C)
} from "lucide-react"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { RiRobot3Line } from "react-icons/ri"
import { MdOutlineFindInPage, MdOutlineQuiz } from "react-icons/md"
import { FaRegUser } from "react-icons/fa6"
import { FcMenu } from "react-icons/fc"
import { useLocation } from "react-router-dom"

import AiInterviewForm from "./aiInterviewForm"
import { logoutUser } from "@/services/authService"
import InterviewCards from "./interviewCards"
import InterviewQuizForm from "./interviewQuizForm"
import QuizCards from "./quizCards"
import OverviewDashboard from "./overviewDashboard"
import AnalyseResume from "./analyseResume"
import Profile from "./profile"
import Roadmap from "./roadmap"
import Codex from "./Codex"

// ✅ Sidebar items
const navItems = [
  { label: "Overview", icon: LayoutGrid },
  { label: "Mock Interview", icon: RiRobot3Line },
  { label: "Quiz", icon: MdOutlineQuiz },
  { label: "CodeX", icon: Code },            // ✅ NOW WORKS
  { label: "Analyse Resume", icon: MdOutlineFindInPage },
  { label: "Roadmap", icon: MdOutlineFindInPage },
  { label: "Profile", icon: FaRegUser },
]

const AfterLoginLayout = () => {
  const [activeTab, setActiveTab] = useState("Overview")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const tab = location.state?.tab

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
      window.history.replaceState({}, document.title)
    }
  }, [tab])

  const handleLogout = async () => {
    await logoutUser()
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#f8fafc]">

      {/* Hover trigger */}
      <div
        className="fixed inset-y-0 left-0 w-4 z-[60]"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      {/* Toggle button */}
      <button
        onMouseEnter={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white border shadow-sm"
      >
        <FcMenu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r
        transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="px-6 py-5 flex items-center gap-3 border-b">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-semibold">Interview.io</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveTab(item.label)
                  setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
                ${activeTab === item.label
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "Overview" && <OverviewDashboard />}
        {activeTab === "Mock Interview" && (
          <div className="flex h-full">
            <div className="w-1/2"><AiInterviewForm /></div>
            <div className="w-1/2"><InterviewCards /></div>
          </div>
        )}
        {activeTab === "Quiz" && (
          <div className="flex h-full">
            <div className="w-1/2"><InterviewQuizForm /></div>
            <div className="w-1/2"><QuizCards /></div>
          </div>
        )}
        {activeTab === "Analyse Resume" && <AnalyseResume />}
        {activeTab === "Roadmap" && <Roadmap />}
        {activeTab === "Profile" && <Profile />}
        {activeTab === "CodeX" && <Codex />}
      </main>
    </div>
  )
}

export default AfterLoginLayout
