import React from 'react'

const ScoreCircle = ({ score, total, size = 140, stroke = 10 }) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  // If `total` is provided, treat `score` as a raw count; otherwise treat it as percentage.
  const rawPercentage = total ? (total === 0 ? 0 : (score / total) * 100) : score
  // Clamp between 0 and 100
  const percentage = Math.max(0, Math.min(100, rawPercentage))

  // Calculate dashoffset from percentage
  const offset = circumference - (circumference * percentage) / 100

  // Use butt linecap for full circle to avoid visual gap at 100%
  const lineCap = percentage === 100 ? 'butt' : 'round'

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap={lineCap}
          className="fill-none stroke-blue-500 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">
        {total !== undefined ? `${score} / ${total}` : `${Math.round(percentage)}%`}
      </div>
    </div>
  )
}

export default ScoreCircle
