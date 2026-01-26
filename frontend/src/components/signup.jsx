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
  const [role, setRole] = useState("candidate")
  const [isLoading, setIsLoading] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const resp = await signup(name, email, password, role)
      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName)
      const dbResp = await axios.post(`${API}/user/add`, { name: name, email: email, firebaseId: resp.uid });
      console.log(dbResp)

      if (dbResp.data.success) {
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Signup failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupWithGoogle = async () => {
    try {
      const resp = await loginWithGoogle();
      console.log(resp);
      localStorage.setItem("userUid", resp.uid)
      localStorage.setItem("name", resp.displayName)
      const dbResp = await axios.post(`${API}/user/add`, { name: resp.displayName, email: resp.email, firebaseId: resp.uid });
      console.log(dbResp)
      if (dbResp.data.success) {
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Signup failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // No animation variants needed

  return (
    <div className="min-h-screen flex items-stretch bg-[#f8fafc]">
      {/* Left: Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 animate-fadein">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="flex flex-col items-center mb-8 transition-opacity duration-700">
            <Zap className="h-8 w-8 text-blue-600 mate-fadein-slow" />
            <h1 className="text-3xl font-bold text-black animate-slidein">Create an account</h1>
            <p className="text-gray-500 mt-1 animate-fadein-slow">Start your journey to interview success</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="transition-all duration-300">
              <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 8-4 8-4s8 0 8 4"/></svg></span>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-9 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="transition-all duration-300">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="m22 7-10 6-10-6"/></svg></span>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-9 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>
            <div className="transition-all duration-300">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="14" height="10" x="5" y="7" rx="2"/><path d="M12 11v2"/></svg></span>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-9 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer active:bg-gray-800 text-white font-semibold py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md focus:ring-2 focus:ring-gray-300 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ transitionProperty: 'background, box-shadow, transform' }}
            >
              {isLoading ? "Creating account..." : "Create account"}
              <span className="ml-1">→</span>
            </button>
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-2 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <button
              type="button"
              onClick={handleSignupWithGoogle}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md focus:ring-2 cursor-pointer focus:ring-blue-200 focus:outline-none"
              style={{ transitionProperty: 'background, box-shadow, transform' }}
            >
              <FcGoogle className="h-5 w-5" />
              Sign up with Google
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-500 animate-fadein-slow">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200">Sign in</Link>
          </p>
        </div>
      </div>
      {/* Right: Info Panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-100 from-[#f8fafc] to-[#ececec] relative animate-fadein-slow">
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-12 rounded-lg">
          <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gray-100 mb-8 shadow animate-fadein">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2 text-center animate-slidein">Join Our Community</h2>
          <p className="text-gray-500 text-center text-base animate-fadein-slow">
            Connect with interviewers and candidates worldwide.<br />
            Get personalized feedback and improve your skills.
          </p>
        </div>
        <div className="absolute inset-0 pointer-events-none"></div>
      </div>
      <style>{`
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadein-slow { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slidein { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: translateY(0);} }
        .animate-fadein { animation: fadein 0.7s ease; }
        .animate-fadein-slow { animation: fadein-slow 1.2s ease; }
        .animate-slidein { animation: slidein 0.7s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </div>
  )
}