export default function Loader({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
      <p className="mt-4 opacity-70">{label}</p>
    </div>
  );
}
