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
  }
} catch (error) {
}

export const isFirebaseAdminEnabled = firebaseAdminEnabled
export default admin
