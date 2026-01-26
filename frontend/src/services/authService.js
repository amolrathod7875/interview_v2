import { auth } from "@/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth"

export async function signupUser(name, email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName: name })
  return result.user
}

export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function logoutUser() {
  await signOut(auth)
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback)
}
