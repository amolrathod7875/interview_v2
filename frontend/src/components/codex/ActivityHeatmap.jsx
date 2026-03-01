import { useMemo } from "react";
import useUserStatsStore from "../../store/useUserStatsStore";

const ActivityHeatmap = () => {
  const { dailyActivityMap } = useUserStatsStore();

  // Generate last 30 days
  const days = useMemo(() => {
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        day: date.getDay(),
        activity: dailyActivityMap?.[dateKey] || { problemsSolved: 0, tokensEarned: 0 }
      });
    }
    return result;
  }, [dailyActivityMap]);

  // Calculate color intensity based on problems solved
  const getColor = (problemsSolved) => {
    if (problemsSolved === 0) return "bg-gray-100";
    if (problemsSolved <= 1) return "bg-green-200";
    if (problemsSolved <= 3) return "bg-green-300";
    if (problemsSolved <= 5) return "bg-green-400";
    return "bg-green-500";
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Group by week
  const weeks = useMemo(() => {
    const result = [];
    let currentWeek = [];
    
    // Fill in days before first day of data
    const firstDay = days[0]?.day || 0;
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }
    
    days.forEach(day => {
      currentWeek.push(day);
      if (day.day === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [days]);

  const maxSolved = Math.max(...days.map(d => d.activity.problemsSolved), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 pr-2">
          {dayLabels.map((label, i) => (
            <div key={label} className="h-3 w-8 text-xs text-gray-400 flex items-center">
              {i % 2 === 1 ? label : ""}
            </div>
          ))}
        </div>
        
        {/* Weeks */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={`h-3 w-3 rounded-sm ${
                  day ? getColor(day.activity.problemsSolved) : "bg-transparent"
                }`}
                title={day ? `${day.date}: ${day.activity.problemsSolved} problems solved` : ""}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-gray-100" />
          <div className="h-3 w-3 rounded-sm bg-green-200" />
          <div className="h-3 w-3 rounded-sm bg-green-300" />
          <div className="h-3 w-3 rounded-sm bg-green-400" />
          <div className="h-3 w-3 rounded-sm bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
