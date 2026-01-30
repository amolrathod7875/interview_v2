import { Link, useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Zap } from "lucide-react"

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200">
      <div className="container mx-auto max-w-6xl h-full px-6 flex items-center justify-between">

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-slate-900">
            Interview.io
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-slate-700">
              Sign in
            </Button>
          </Link>

          <Link to="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
        </div>

      </div>
    </header>
  )
}
