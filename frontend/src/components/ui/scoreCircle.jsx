import React from 'react'

const ScoreCircle = ({ score, total, size = 140, stroke = 10 }) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

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
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * score) / 100}
          strokeLinecap="round"
          className="fill-none stroke-blue-500 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">
        {total !== undefined? `${score} / ${total}`: `${score}%`}
      </div>
    </div>
  )
}

export default ScoreCircle
