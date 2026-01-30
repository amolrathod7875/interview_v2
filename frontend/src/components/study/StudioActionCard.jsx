export default function StudioActionCard({ title, description }) {
  return (
    <button className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
      <h3 className="font-medium">{title}</h3>
      <p className="text-xs opacity-60 mt-1">{description}</p>
    </button>
  )
}
