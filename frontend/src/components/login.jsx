import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "./ui/input"
import { Label } from "@radix-ui/react-label"
import { useAuth } from "@/contexts/authContext"
import { FcGoogle } from "react-icons/fc"
import { loginWithGoogle } from "@/services/authService"
import axios from "axios"
import { Zap } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  // ---------------- EMAIL + PASSWORD LOGIN ----------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const resp = await login(email, password)

      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName || "")

      await axios.post(`${API}/user/sync`, {
        name: resp.displayName || "",
        email: resp.email,
        firebaseId: resp.uid,
        photoURL: resp.photoURL || "",
      })

      navigate("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------- GOOGLE LOGIN ----------------
  const handleSigninWithGoogle = async () => {
    setIsLoading(true)

    try {
      const resp = await loginWithGoogle()

      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName || "")

      await axios.post(`${API}/user/sync`, {
        name: resp.displayName || "",
        email: resp.email,
        firebaseId: resp.uid,
        photoURL: resp.photoURL || "",
      })

      navigate("/dashboard")
    } catch (error) {
      console.error("Google login failed:", error)
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
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
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
              className="w-full flex items-center justify-center gap-2 border py-2 rounded-md"
            >
              <FcGoogle />
              Sign in with Google
            </button>
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
