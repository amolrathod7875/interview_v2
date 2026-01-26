// import admin from "../config/firebase.js"

// export const authenticate = async (req, res, next) => {
//   const header = req.headers.authorization
//   if (!header) return res.status(401).send("No token")

//   const token = header.split(" ")[1]

//   try {
//     const decoded = await admin.auth().verifyIdToken(token)
//     req.user = decoded
//     next()
// //   } catch {
//     res.status(401).send("Invalid token")
//   }
// }
