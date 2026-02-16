import { useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";

export default function ThreePaneLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  defaultLeftSizes = [22, 54, 24],
}) {
  const [sizes, setSizes] = useState(defaultLeftSizes);
  const [isDragging, setIsDragging] = useState(null);
  const containerRef = useRef(null);

  const handleMouseDown = (position) => (e) => {
    e.preventDefault();
    setIsDragging(position);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const totalWidth = rect.width;
      const mouseX = e.clientX - rect.left;

      // Calculate new sizes as percentages
      let newLeftSize, newCenterSize, newRightSize;

      if (isDragging === "left") {
        newLeftSize = Math.min(35, Math.max(15, (mouseX / totalWidth) * 100));
        newCenterSize = sizes[1];
        newRightSize = 100 - newLeftSize - newCenterSize;
      } else if (isDragging === "right") {
        newRightSize = Math.min(40, Math.max(20, ((totalWidth - mouseX) / totalWidth) * 100));
        newCenterSize = sizes[1];
        newLeftSize = 100 - newCenterSize - newRightSize;
      }

      if (newLeftSize && newRightSize) {
        // Ensure center has minimum space
        const centerPercent = 100 - newLeftSize - newRightSize;
        if (centerPercent >= 40) {
          setSizes([newLeftSize, centerPercent, newRightSize]);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, sizes]);

  return (
    <div 
      ref={containerRef}
      className="h-screen bg-[#f8fafc] text-[#1e293b] overflow-hidden flex"
    >
      {/* Left Panel - Sources */}
      <div 
        className="h-full border-r border-[#e2e8f0] flex-shrink-0 bg-white"
        style={{ width: `${sizes[0]}%` }}
      >
        <div className="h-full flex flex-col">
          {leftPanel}
        </div>
      </div>

      {/* Left Resize Handle */}
      <div
        onMouseDown={handleMouseDown("left")}
        className={`w-1 bg-[#e2e8f0] hover:bg-[#3b82f6] transition-colors cursor-col-resize flex items-center justify-center flex-shrink-0 ${
          isDragging === "left" ? "bg-[#3b82f6]" : ""
        }`}
      >
        <GripVertical className="text-[#94a3b8] h-4 w-4" />
      </div>

      {/* Center Panel - Chat */}
      <div 
        className="h-full border-r border-[#e2e8f0] flex-shrink-0 bg-[#f8fafc]"
        style={{ width: `${sizes[1]}%`, minWidth: "40%" }}
      >
        <div className="h-full flex flex-col">
          {centerPanel}
        </div>
      </div>

      {/* Right Resize Handle */}
      <div
        onMouseDown={handleMouseDown("right")}
        className={`w-1 bg-[#e2e8f0] hover:bg-[#3b82f6] transition-colors cursor-col-resize flex items-center justify-center flex-shrink-0 ${
          isDragging === "right" ? "bg-[#3b82f6]" : ""
        }`}
      >
        <GripVertical className="text-[#94a3b8] h-4 w-4" />
      </div>

      {/* Right Panel - Studio */}
      <div 
        className="h-full flex-shrink-0 bg-white"
        style={{ width: `${sizes[2]}%` }}
      >
        <div className="h-full flex flex-col">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
