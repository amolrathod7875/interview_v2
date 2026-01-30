export default function ChatPanel() {
  return (
    <div className="h-full flex flex-col">

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            This document explains data conversion techniques used in
            Analog-to-Digital Converters, focusing on Binary to Gray
            code conversion using XOR logic...
          </p>
        </div>

        <ChatMessage role="assistant">
          XOR gates are commonly used because each Gray code bit depends
          on the previous binary bit.
        </ChatMessage>

      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <input
          placeholder="Ask a question about your sources..."
          className="w-full bg-white/5 rounded-lg px-4 py-3 text-sm outline-none"
        />
      </div>

    </div>
  )
}

function ChatMessage({ role, children }) {
  return (
    <div
      className={`max-w-[80%] p-4 rounded-xl text-sm ${
        role === "assistant"
          ? "bg-blue-500/10 text-blue-200"
          : "bg-white/10 ml-auto"
      }`}
    >
      {children}
    </div>
  )
}
