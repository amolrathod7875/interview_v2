import { Clock, CheckCircle, XCircle, Loader, Trash2 } from "lucide-react";

export default function ActivityLog({ activities = [], onClear }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />;
      case "failed":
        return <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />;
      case "in-progress":
        return <Loader className="w-3.5 h-3.5 text-[#3b82f6] animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#eab308]" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
          Recent Activity
        </h3>
        {activities.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="p-1 hover:bg-[#f1f5f9] rounded transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-3 h-3 text-[#64748b]" />
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <p className="text-xs text-[#94a3b8] py-2">No recent activity</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]"
            >
              {getStatusIcon(activity.status)}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#334155] truncate">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-[10px] text-[#64748b] truncate">
                    {activity.description}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-[#94a3b8] flex-shrink-0">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
