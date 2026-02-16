export default function StudioWidget({
  icon,
  label,
  description,
  active = false,
  onClick,
  badge,
  disabled = false,
}) {
  const Icon = icon;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full p-4 rounded-xl border text-left transition-all
        ${active 
          ? "border-[#3b82f6] bg-[#e0e7ff] ring-1 ring-[#3b82f6]" 
          : "border-[#e2e8f0] bg-white hover:border-[#3b82f6] hover:ring-1 hover:ring-[#93c5fd]"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#3b82f6] text-white rounded">
          {badge}
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${active ? "bg-[#3b82f6]" : "bg-[#e0e7ff]"}`}>
          <Icon className={`w-5 h-5 ${active ? "text-white" : "text-[#3b82f6]"}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${active ? "text-[#1e293b]" : "text-[#334155]"}`}>
            {label}
          </h3>
          {description && (
            <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
