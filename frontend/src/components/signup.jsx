import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "./ui/input"
import { Label } from "@radix-ui/react-label"
import { useAuth } from "@/contexts/authContext"
import { Zap, Users } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { loginWithGoogle } from "@/services/authService"
import axios from "axios"

const API = import.meta.env.VITE_API_BASE_URL

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  // ---------------- EMAIL + PASSWORD SIGNUP ----------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

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
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------- GOOGLE SIGNUP ----------------
  const handleSignupWithGoogle = async () => {
    setIsLoading(true)

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
            <div>
              <Label>Full Name</Label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
              className="w-full flex items-center justify-center gap-2 border py-2 rounded-md"
            >
              <FcGoogle />
              Sign up with Google
            </button>
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
