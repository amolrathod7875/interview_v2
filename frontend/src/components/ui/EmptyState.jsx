import { Sparkles } from "lucide-react"

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
}) {
  const StateIcon = Icon || Sparkles

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <StateIcon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
