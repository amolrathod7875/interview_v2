import { Sparkles, FileText, Users, Briefcase, BookOpen, GraduationCap } from "lucide-react"

// Illustration components
const InterviewIllustration = () => (
  <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#DBEAFE" />
    <circle cx="35" cy="45" r="8" fill="#3B82F6" />
    <circle cx="65" cy="45" r="8" fill="#3B82F6" />
    <path d="M35 65 Q50 75 65 65" stroke="#3B82F6" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="25" y="30" width="50" height="6" rx="3" fill="#93C5FD" />
  </svg>
)

const QuizIllustration = () => (
  <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#E0E7FF" />
    <rect x="30" y="30" width="40" height="40" rx="8" fill="#6366F1" />
    <text x="50" y="58" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">?</text>
    <circle cx="70" cy="25" r="8" fill="#818CF8" />
  </svg>
)

const JobIllustration = () => (
  <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#FEF3C7" />
    <rect x="25" y="35" width="50" height="35" rx="4" fill="#F59E0B" />
    <rect x="35" y="25" width="30" height="15" rx="2" fill="#F59E0B" />
    <rect x="40" y="45" width="20" height="3" rx="1.5" fill="white" />
    <rect x="40" y="52" width="20" height="3" rx="1.5" fill="white" />
    <rect x="40" y="59" width="15" height="3" rx="1.5" fill="white" />
  </svg>
)

const ResumeIllustration = () => (
  <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#D1FAE5" />
    <rect x="28" y="25" width="44" height="55" rx="4" fill="#10B981" />
    <rect x="34" y="35" width="32" height="4" rx="2" fill="white" />
    <rect x="34" y="45" width="25" height="3" rx="1.5" fill="white" opacity="0.7" />
    <rect x="34" y="52" width="28" height="3" rx="1.5" fill="white" opacity="0.7" />
    <rect x="34" y="59" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
    <rect x="34" y="66" width="24" height="3" rx="1.5" fill="white" opacity="0.7" />
  </svg>
)

const RoadmapIllustration = () => (
  <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#FCE7F3" />
    <circle cx="50" cy="25" r="8" fill="#EC4899" />
    <circle cx="50" cy="50" r="8" fill="#EC4899" />
    <circle cx="50" cy="75" r="8" fill="#EC4899" />
    <line x1="50" y1="33" x2="50" y2="42" stroke="#EC4899" strokeWidth="3" />
    <line x1="50" y1="58" x2="50" y2="67" stroke="#EC4899" strokeWidth="3" />
  </svg>
)

const DefaultIllustration = () => (
  <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#E0E7FF" />
    <path d="M40 45 L50 35 L60 45 L50 55 Z" fill="#6366F1" />
    <circle cx="50" cy="45" r="5" fill="#A5B4FC" />
  </svg>
)

// Map of icon names to illustrations
const illustrationMap = {
  FileText: ResumeIllustration,
  Users: InterviewIllustration,
  Briefcase: JobIllustration,
  BookOpen: RoadmapIllustration,
  GraduationCap: QuizIllustration,
  Sparkles: DefaultIllustration,
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  variant = 'default',
}) {
  const StateIcon = Icon || Sparkles
  const Illustration = illustrationMap[StateIcon?.name] || DefaultIllustration

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
      <Illustration />
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 hover:scale-105 active:scale-95"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
