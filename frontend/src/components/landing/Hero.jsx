import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { ArrowRight, Zap } from "lucide-react"

export default function Hero() {
  return (
    <section className="pt-48 pb-40 px-4 bg-white">
      <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-24 items-center">

        {/* LEFT: TEXT */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 mb-10">
            <Zap className="h-4 w-4" />
            AI-Powered Interview Prep
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-slate-900 mb-8">
            Ace Your Next <br />
            <span className="text-blue-600">Technical Interview</span>
          </h1>

          <p className="text-xl text-slate-600 mb-14 max-w-xl leading-relaxed">
            Practice mock interviews, quizzes, resume analysis, and track job
            applications — all from a single, structured dashboard.
          </p>

          <div className="flex items-center gap-6">
            <Link to="/signup">
              <Button
                size="lg"
                className="px-8 py-6 text-base bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 ring-2 ring-blue-600/20 hover:ring-blue-600/40"
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base border-slate-300 hover:border-slate-400"
              >
                I have an account
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT: DASHBOARD PREVIEW */}
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* Top Bar */}
            <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>

            <div className="flex h-[420px]">

              {/* Sidebar */}
              <div className="w-52 bg-slate-50 border-r border-slate-200 p-4 space-y-2 text-sm">
                {[
                  "Overview",
                  "Mock Interview",
                  "Quiz",
                  "CodeX",
                  "Job Tracker",
                  "Study Companion",
                  "Resume",
                  "Roadmap"
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-md px-3 py-2 ${
                      i === 0
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-slate-700 font-medium"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Main Panel */}
              <div className="flex-1 p-6 space-y-8">

                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Dashboard Overview
                  </h3>
                  <p className="text-sm text-slate-600">
                    Track your interview preparation progress
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Interviews", value: 12 },
                    { label: "Quizzes", value: 12 },
                    { label: "Applications", value: 12 }
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-xs text-slate-600 font-medium mb-1">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Feature Tiles — IMPROVED CONTRAST */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  {[
                    "CodeX",
                    "Study Companion",
                    "Resume Analysis",
                    "Roadmap"
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="
                        h-16
                        rounded-xl
                        bg-slate-100
                        px-5
                        pt-4
                        text-sm
                        font-semibold
                        text-slate-800
                        leading-snug
                        flex
                        items-start
                      "
                    >
                      {feature}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}