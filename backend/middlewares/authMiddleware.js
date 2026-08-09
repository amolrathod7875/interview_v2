import admin, { isFirebaseAdminEnabled } from "../config/firebase.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function decodeLocalToken(token) {
  try {
    const parts = token.split(".")
    if (parts.length < 3 || parts[0] !== "local") return null

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"))
    return payload?.uid ? payload : null
  } catch {
    return null
  }
}

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: missing token" });
    }

    let decoded;

    if (isFirebaseAdminEnabled) {
      decoded = await admin.auth().verifyIdToken(token);
    } else {
      const allowUnverified = process.env.NODE_ENV !== "production";
      if (!allowUnverified) {
        return res.status(503).json({
          error: "Auth service unavailable: Firebase Admin is not configured",
        });
      }

      decoded = decodeJwtPayload(token);
      if (!decoded?.user_id && !decoded?.sub && !decoded?.uid) {
        decoded = decodeLocalToken(token);
      }

      if (!decoded?.user_id && !decoded?.sub && !decoded?.uid) {
        return res.status(401).json({ error: "Unauthorized: invalid token payload" });
      }
    }

    const firebaseUid = decoded.uid || decoded.user_id || decoded.sub;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ firebaseId: firebaseUid }).select("_id firebaseId email");
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: user not synced" });
      }

      req.user = {
        id: user._id.toString(),
        firebaseId: user.firebaseId,
        email: user.email || decoded.email || ""
      };
    } else {
      req.user = {
        id: firebaseUid,
        firebaseId: firebaseUid,
        email: decoded.email || ""
      };
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}
