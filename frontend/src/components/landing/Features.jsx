import {
  MonitorPlay,
  ClipboardList,
  FileSearch,
  GitPullRequest,
  BriefcaseBusiness,
  Bot
} from "lucide-react"

const features = [
  {
    icon: MonitorPlay,
    title: "AI Mock Interviews",
    description:
      "Simulate real interviews with AI-driven questions and instant feedback."
  },
  {
    icon: ClipboardList,
    title: "Smart Quizzes",
    description:
      "Topic-wise quizzes that adapt to your skill level and progress."
  },
  {
    icon: FileSearch,
    title: "Resume Analyzer",
    description:
      "Get actionable AI feedback to improve your resume and ATS score."
  },
  {
    icon: BriefcaseBusiness,
    title: "Job Application Tracker",
    description:
      "Track applied, interviews, offers, and rejections in one place."
  },
  {
    icon: GitPullRequest,
    title: "GitHub Repository Analysis",
    description:
      "Analyze your projects to understand interview readiness."
  },
  {
    icon: Bot,
    title: "AI Study Companion",
    description:
      "Personal AI assistant to guide your entire interview journey."
  }
]

export default function Features() {
  return (
    <section className="py-40 px-4 bg-slate-50">
      <div className="container mx-auto max-w-6xl">

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Everything you need — in one dashboard
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Built to track progress, identify gaps, and help you crack
            interviews with confidence.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="
                group
                bg-white
                border border-slate-200
                rounded-2xl
                p-10
                transition-all
                duration-300
                ease-out
                hover:-translate-y-1
                hover:shadow-lg
                hover:border-blue-300
                hover:bg-blue-50/30
              "
            >
              {/* Icon */}
              <div
                className="
                  flex h-14 w-14 items-center justify-center rounded-xl
                  bg-blue-50
                  mb-8
                  transition-colors
                  duration-300
                  group-hover:bg-blue-100
                "
              >
                <feature.icon
                  className="h-7 w-7 text-blue-600 stroke-[1.5]"
                />
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                {feature.title}
              </h3>

              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
