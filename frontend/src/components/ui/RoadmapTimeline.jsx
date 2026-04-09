// components/ui/RoadmapTimeline.jsx
import React from "react"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./hover-card"
import { CheckCircle } from "lucide-react"

const RoadmapTimeline = ({ levels, formatHoverContent, onItemClick }) => {
  return (
    <div className="relative flex gap-10">

      {/* Vertical timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-[8px] bg-primary rounded-full" />

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
                bg-primary
                border-[5px] border-background
                shadow-lg
              "
            />

            {/* Section title */}
            <h2 className="text-2xl font-semibold text-foreground mb-5">
              {level.title}
            </h2>

            {/* Cards */}
            {level.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {level.items.map((item, i) => (
                  <HoverCard key={i} openDelay={150}>
                    <HoverCardTrigger asChild>
                      <div 
                        onClick={() => onItemClick && onItemClick(item, level.title.toLowerCase())}
                        className={`
                          border rounded-xl p-5 shadow-sm transition cursor-pointer
                          ${item.completed 
                            ? "bg-green-500/10 border-green-500/30 hover:shadow-md hover:border-green-500/40" 
                            : "bg-card border-border hover:shadow-md hover:border-primary/30"
                          }
                        `}
                      >
                        <div className="flex items-start gap-2">
                          {item.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-foreground font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                              {item.key}
                            </p>
                            {item.quizScore !== null && item.quizScore !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Score: {item.quizScore}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </HoverCardTrigger>

                    <HoverCardContent className="max-w-xs text-sm">
                      {formatHoverContent(item.value)}
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
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
