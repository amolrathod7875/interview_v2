import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/authContext"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null

  const isDev = import.meta.env.DEV || import.meta.env.MODE === "development"

  if (!user && !isDev) return <Navigate to="/login" replace />

  return children
}