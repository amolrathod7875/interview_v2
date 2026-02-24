// components/ui/RoadmapTimeline.jsx
import React from "react"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./hover-card"

const RoadmapTimeline = ({ levels, formatHoverContent }) => {
  return (
    <div className="relative flex gap-10">

      {/* Vertical timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-[8px] bg-blue-500 rounded-full" />

      {/* Content */}
      <div className="flex flex-col gap-20 w-full pl-16">
        {levels.map((level, idx) => (
          <div key={idx} className="relative">

            {/* Timeline node */}
            <div
              className="
                absolute -left-[55px] top-2
                w-8 h-8
                rounded-full
                bg-blue-600
                border-[5px] border-white
                shadow-lg
              "
            />

            {/* Section title */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-5">
              {level.title}
            </h2>

            {/* Cards */}
            {level.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {level.items.map((item, i) => (
                  <HoverCard key={i} openDelay={150}>
                    <HoverCardTrigger asChild>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer">
                        <p className="text-gray-700 font-medium">
                          {item.key}
                        </p>
                      </div>
                    </HoverCardTrigger>

                    <HoverCardContent className="max-w-xs text-sm">
                      {formatHoverContent(item.value)}
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No items available for this level.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default RoadmapTimeline
