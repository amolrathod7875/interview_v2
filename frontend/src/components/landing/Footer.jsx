export default function Footer() {
  return (
    <footer className="border-t border-slate-200 py-10 px-4 bg-white">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-semibold text-slate-900">
          Interview.io
        </div>

        <div className="flex gap-6 text-sm text-slate-600">
          <a className="hover:text-slate-900">Features</a>
          <a className="hover:text-slate-900">Pricing</a>
          <a className="hover:text-slate-900">Privacy</a>
          <a className="hover:text-slate-900">Contact</a>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Interview.io
        </p>
      </div>
    </footer>
  )
}
