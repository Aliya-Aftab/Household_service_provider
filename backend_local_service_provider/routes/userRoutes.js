import express from "express";
import User from "../models/User.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  deleteUser,
  updateUserLocation,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Session check (verifies HttpOnly cookie and returns full user without password)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch session user" });
  }
});

// Protected routes
router.patch("/location", protect, updateUserLocation);

// Admin-only routes
router.get("/", protect, authorize("admin"), getUsers);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;