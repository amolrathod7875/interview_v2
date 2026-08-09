import { auth, clearLocalAuthUser, isLocalAuthMode, setLocalAuthUser } from "@/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth"

function buildLocalUser(email, displayName = "Local Dev User") {
  const uid = `local-${email || "user"}`.replace(/[^a-zA-Z0-9_-]/g, "_")
  const token = `local.${btoa(JSON.stringify({ uid, email, name: displayName }))}.token`

  return {
    uid,
    email,
    displayName,
    photoURL: "",
    token,
    getIdToken: async () => token,
  }
}

export async function signupUser(name, email, password) {
  if (isLocalAuthMode) {
    const user = buildLocalUser(email, name)
    setLocalAuthUser(user)
    return user
  }

  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName: name })
  return result.user
}

export async function loginUser(email, password) {
  if (isLocalAuthMode) {
    const user = buildLocalUser(email, email.split("@")[0] || "Local Dev User")
    setLocalAuthUser(user)
    return user
  }

  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export function getGoogleAuthErrorMessage(error) {
  const code = error?.code || ""

  if (code === "auth/configuration-not-found") {
    return "Google sign-in isn't enabled for this Firebase project. Enable the Google provider in the Firebase console (Authentication → Sign-in method) or contact the admin."
  }
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled. Please try again."
  }
  if (code === "auth/popup-blocked") {
    return "Google sign-in popup was blocked by the browser. Allow popups and try again."
  }
  if (code === "auth/network-request-failed") {
    return "Network error during Google sign-in. Check your connection and try again."
  }

  return error?.message || "Google sign-in failed. Please try again."
}

export async function loginWithGoogle() {
  if (isLocalAuthMode) {
    const user = buildLocalUser("local@dev", "Local Google User")
    setLocalAuthUser(user)
    return user
  }

  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function logoutUser() {
  if (isLocalAuthMode) {
    clearLocalAuthUser()
    return
  }

  await signOut(auth)
}

export function subscribeToAuth(callback) {
  if (isLocalAuthMode) {
    callback(auth.currentUser)

    const handler = () => callback(auth.currentUser)
    window.addEventListener("storage", handler)
    window.addEventListener("local-auth-changed", handler)

    return () => {
      window.removeEventListener("storage", handler)
      window.removeEventListener("local-auth-changed", handler)
    }
  }

  return onAuthStateChanged(auth, callback)
}
