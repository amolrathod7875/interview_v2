import FileUploader from "./FileUploader"

export default function SourcesPanel() {
  return (
    <div className="h-full flex flex-col p-4">

      <h2 className="text-sm font-semibold mb-3 opacity-80">
        Sources
      </h2>

      <FileUploader />

      {/* Uploaded files list */}
      <div className="mt-4 space-y-2 overflow-y-auto">
        <SourceItem name="DELD_LAB_02.pdf" />
        <SourceItem name="DELD_LAB_03.pdf" />
      </div>
    </div>
  )
}

function SourceItem({ name }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-white/5 text-sm flex justify-between">
      <span className="truncate">{name}</span>
      <button className="opacity-50 hover:opacity-100">✕</button>
    </div>
  )
}
