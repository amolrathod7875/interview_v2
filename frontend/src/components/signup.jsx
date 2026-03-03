import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "./ui/input"
import { Label } from "@radix-ui/react-label"
import { useAuth } from "@/contexts/authContext"
import { Lock, Mail, ShieldCheck, User, Users, Zap } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { loginWithGoogle } from "@/services/authService"
import axios from "axios"

const RAW_API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "")

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { signup } = useAuth()
  const navigate = useNavigate()

  const getPasswordStrength = (value) => {
    let score = 0
    if (value.length >= 8) score += 1
    if (/[A-Z]/.test(value)) score += 1
    if (/[0-9]/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1
    return score
  }

  const strength = getPasswordStrength(password)
  const strengthLabel =
    strength <= 1 ? "Weak" : strength <= 3 ? "Medium" : "Strong"
  const strengthColor =
    strength <= 1
      ? "bg-red-500"
      : strength <= 3
      ? "bg-amber-500"
      : "bg-emerald-500"

  // ---------------- EMAIL + PASSWORD SIGNUP ----------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      const resp = await signup(name, email, password)

      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName || name)

      // SYNC USER WITH MONGODB
      await axios.post(`${API}/user/sync`, {
        name: resp.displayName || name,
        email: resp.email,
        firebaseId: resp.uid,
        photoURL: resp.photoURL || "",
      })

      navigate("/dashboard")
    } catch (error) {
      console.error("Signup failed:", error)
      setErrorMessage(error?.message || "Signup failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------- GOOGLE SIGNUP ----------------
  const handleSignupWithGoogle = async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const resp = await loginWithGoogle()

      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName || "")

      // SYNC USER WITH MONGODB
      await axios.post(`${API}/user/sync`, {
        name: resp.displayName || "",
        email: resp.email,
        firebaseId: resp.uid,
        photoURL: resp.photoURL || "",
      })

      navigate("/dashboard")
    } catch (error) {
      console.error("Google signup failed:", error)
      setErrorMessage(error?.message || "Google signup failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-stretch bg-[#f8fafc]">
      {/* Left: Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="flex flex-col items-center mb-8">
            <Zap className="h-8 w-8 text-blue-600 mb-2" />
            <h1 className="text-3xl font-bold text-black">Create an account</h1>
            <p className="text-gray-500 mt-1">
              Start your journey to interview success
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : null}
            <div>
              <Label>Full Name</Label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

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
              {password ? (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full transition-all ${strengthColor}`}
                      style={{ width: `${Math.max(strength, 1) * 25}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Password strength: {strengthLabel}</p>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 py-2 font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 active:scale-[0.99]"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>

            <div className="flex items-center my-2">
              <div className="flex-grow border-t" />
              <span className="mx-2 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t" />
            </div>

            <button
              type="button"
              onClick={handleSignupWithGoogle}
              disabled={isLoading}
              className="w-full rounded-md border py-2 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <span className="flex items-center justify-center gap-2">
                <FcGoogle />
                Sign up with Google
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure signup · Your profile is encrypted
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-100">
        <Users className="h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-black">Join Our Community</h2>
        <p className="text-gray-500 text-center max-w-sm mt-2">
          Connect with interviewers and candidates worldwide.  
          Get personalized feedback and improve your skills.
        </p>
      </div>
    </div>
  )
}
