import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const hasFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_AUTH_DOMAIN &&
    import.meta.env.VITE_PROJECT_ID &&
    import.meta.env.VITE_APP_ID
)

export const isLocalAuthMode =
  import.meta.env.VITE_LOCAL_AUTH_MODE === "true"

const firebaseConfig = hasFirebaseConfig
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_APP_ID,
      measurementId: import.meta.env.VITE_MEASUREMENT_ID,
    }
  : null

const LOCAL_AUTH_STORAGE_KEY = "localAuthUser"

function readLocalUser() {
  if (typeof window === "undefined") return null

  const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const user = JSON.parse(raw)
    return {
      ...user,
      getIdToken: async () => user.token || "local-dev-token",
    }
  } catch {
    return null
  }
}

export function setLocalAuthUser(user) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event("local-auth-changed"))
}

export function clearLocalAuthUser() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event("local-auth-changed"))
}

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null

export const auth = hasFirebaseConfig
  ? getAuth(app)
  : {
      get currentUser() {
        return readLocalUser()
      },
    }
