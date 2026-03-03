import admin from "firebase-admin"
import fs from "fs"
import path from "path"

let firebaseAdminEnabled = false

const credentialPath = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH
  ? path.resolve(process.cwd(), process.env.FIREBASE_ADMIN_CREDENTIALS_PATH)
  : path.resolve(process.cwd(), "firebase-admin.json")

const serviceAccountFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

try {
  let serviceAccount = null

  if (serviceAccountFromEnv) {
    serviceAccount = JSON.parse(serviceAccountFromEnv)
  } else if (fs.existsSync(credentialPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(credentialPath, "utf8"))
  }

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    firebaseAdminEnabled = true
    console.log("Firebase Admin initialized")
  } else {
    console.warn(
      "Firebase Admin credentials missing. Protected routes requiring token verification will return 503 until configured."
    )
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error.message)
}

export const isFirebaseAdminEnabled = firebaseAdminEnabled
export default admin
