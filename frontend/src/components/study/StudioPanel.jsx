import {
  Headphones,
  GitBranch,
  FileText,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import StudioWidget from "./StudioWidget";
import ActivityLog from "./ActivityLog";

const STUDIO_WIDGETS = [
  {
    id: "audio",
    icon: Headphones,
    label: "Audio Overview",
    description: "Listen to a spoken summary",
    badge: "New",
  },
  {
    id: "mindmap",
    icon: GitBranch,
    label: "Mind Map",
    description: "Visual concept mapping",
  },
  {
    id: "reports",
    icon: FileText,
    label: "Reports",
    description: "Generate study reports",
  },
  {
    id: "flashcards",
    icon: CreditCard,
    label: "Flashcards",
    description: "Key concepts for quick recall",
  },
  {
    id: "quiz",
    icon: ClipboardList,
    label: "Quiz",
    description: "Test your understanding",
  },
];

export default function StudioPanel({
  activeMode,
  onModeChange,
  activities = [],
  onClearActivity,
}) {
  return (
    <div className="h-full flex flex-col p-4 bg-[#0f0f0f]">
      {/* Header */}
      <h2 className="text-sm font-semibold text-white mb-4">Studio</h2>

      {/* Widget Grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {STUDIO_WIDGETS.map((widget) => (
          <StudioWidget
            key={widget.id}
            icon={widget.icon}
            label={widget.label}
            description={widget.description}
            badge={widget.badge}
            active={activeMode === widget.id}
            onClick={() => onModeChange?.(widget.id)}
          />
        ))}
      </div>

      {/* Activity Log */}
      <div className="mt-auto pt-4 border-t border-[#2a2a2a]">
        <ActivityLog
          activities={activities}
          onClear={onClearActivity}
        />
      </div>
    </div>
  );
}
