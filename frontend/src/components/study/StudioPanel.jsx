import StudioActionCard from "./StudioActionCard"

export default function StudioPanel() {
  return (
    <div className="h-full p-4 space-y-3">

      <h2 className="text-sm font-semibold mb-2 opacity-80">
        Studio
      </h2>

      <StudioActionCard
        title="Audio Overview"
        description="Listen to a spoken summary"
      />

      <StudioActionCard
        title="Flashcards"
        description="Key concepts for quick recall"
      />

      <StudioActionCard
        title="Quiz"
        description="Test your understanding"
      />

    </div>
  )
}
