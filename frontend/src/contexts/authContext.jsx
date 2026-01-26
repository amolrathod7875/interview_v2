import { createContext, useContext, useEffect, useState } from "react"
import {
  signupUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth
} from "@/services/authService"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(name, email, password) {
    return signupUser(name, email, password)
  }

  async function login(email, password) {
    return loginUser(email, password)
  }

  async function googleLogin() {
    return loginWithGoogle()
  }

  async function logout() {
    return logoutUser()
  }

  useEffect(() => {
    const unsub = subscribeToAuth(currentUser => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsub
  }, [])

  const value = { user, signup, login, googleLogin, logout }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
