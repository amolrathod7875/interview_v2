import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "./ui/input"
import { Label } from "@radix-ui/react-label"
import { useAuth } from "@/contexts/authContext"
import { FcGoogle } from "react-icons/fc"
import { loginWithGoogle } from "@/services/authService"
import axios from "axios"
import { Lock, Mail, ShieldCheck, Zap } from "lucide-react"

const RAW_API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "")

async function syncUserToBackend(resp) {
  try {
    await axios.post(`${API}/user/sync`, {
      name: resp.displayName || "",
      email: resp.email,
      firebaseId: resp.uid,
      photoURL: resp.photoURL || "",
    })
  } catch (error) {
    console.warn("User sync skipped (backend unavailable):", error?.message)
  }
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  // ---------------- EMAIL + PASSWORD LOGIN ----------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      const resp = await login(email, password)

      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName || "")

      await syncUserToBackend(resp)

      navigate("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)
      setErrorMessage(error?.message || "Login failed. Please check your credentials and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------- GOOGLE LOGIN ----------------
  const handleSigninWithGoogle = async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const resp = await loginWithGoogle()

      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName || "")

      await syncUserToBackend(resp)

      navigate("/dashboard")
    } catch (error) {
      console.error("Google login failed:", error)
      setErrorMessage(error?.message || "Google sign-in failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-stretch bg-[#f8fafc]">
      <div className="flex-1 flex items-center justify-center px-4 py-8 animate-fadein">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="flex flex-col items-center mb-8">
            <Zap className="h-8 w-8 text-blue-600 mb-2" />
            <h1 className="text-3xl font-bold text-black">Welcome back</h1>
            <p className="text-gray-500 mt-1">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : null}
            <div>
              <Label>Email</Label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 py-2 font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 active:scale-[0.99]"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <div className="flex items-center my-2">
              <div className="flex-grow border-t" />
              <span className="mx-2 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t" />
            </div>

            {/* GOOGLE LOGIN */}
            <button
              type="button"
              onClick={handleSigninWithGoogle}
              disabled={isLoading}
              className="w-full rounded-md border py-2 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <span className="flex items-center justify-center gap-2">
                <FcGoogle />
                Sign in with Google
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure login · Your data stays protected
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
