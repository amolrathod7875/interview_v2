import express from "express";
import userModel from "../models/userModel.js";

const router = express.Router();

/* =========================================================
   1. SYNC USER (AUTO CREATE ON LOGIN / SIGNUP)
   ========================================================= */
router.post("/sync", async (req, res) => {
  try {
    const { name, email, firebaseId, photoURL } = req.body;

    if (!email || !firebaseId) {
      return res.status(400).json({
        success: false,
        message: "email and firebaseId are required",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        data: {
          _id: firebaseId,
          firebaseId,
          name: name || "",
          email,
          photoURL: photoURL || "",
        },
        offline: true,
      });
    }

    let user = await userModel.findOne({ firebaseId });

    if (!user) {
      user = await userModel.create({
        name,
        email,
        firebaseId,
        photoURL,
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(" USER SYNC ERROR:", err);
    res.status(500).json({
      success: false,
      message: "User sync failed",
    });
  }
});

/* =========================================================
   2. GET CURRENT USER PROFILE
   ========================================================= */
router.get("/me", async (req, res) => {
  try {
    const { firebaseId } = req.query;

    if (!firebaseId) {
      return res.status(400).json({
        success: false,
        message: "firebaseId is required",
      });
    }

    const user = await userModel.findOne({ firebaseId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(" GET USER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

/* =========================================================
   3. UPDATE USER PROFILE
   ========================================================= */
router.put("/update", async (req, res) => {
  try {
    const { firebaseId } = req.body;

    if (!firebaseId) {
      return res.status(400).json({
        success: false,
        message: "firebaseId is required",
      });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { firebaseId },
      {
        $set: {
          name: req.body.name,
          dob: req.body.dob,
          linkedin: req.body.linkedin,
          github: req.body.github, // full object allowed
          leetcode: req.body.leetcode,
          kaggle: req.body.kaggle,
          photoURL: req.body.photoURL,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    console.error(" UPDATE USER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "User update failed",
    });
  }
});

/* =========================================================
   4. SAVE SELECTED GITHUB REPOSITORY
   ========================================================= */
router.post("/github/repo", async (req, res) => {
  try {
    const { firebaseId, owner, repo } = req.body;

    if (!firebaseId || !owner || !repo) {
      return res.status(400).json({
        success: false,
        message: "firebaseId, owner and repo are required",
      });
    }

    const user = await userModel.findOneAndUpdate(
      { firebaseId },
      {
        $set: {
          github: {
            connected: true,
            owner,
            repo,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "GitHub repository saved successfully",
      data: user.github,
    });
  } catch (err) {
    console.error(" SAVE GITHUB REPO ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save GitHub repository",
    });
  }
});

export default router;
