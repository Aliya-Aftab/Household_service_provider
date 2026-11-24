import express from "express";
import ServiceProviderProfile from "../models/ServiceProvider.js";
import {
  createProviderProfile,
  getNearbyProviders,
  getAllProviders,
  getAllProvidersAdmin,
  getProviderById,
  updateProviderProfile,
  deleteProviderProfile,
  verifyProvider,
  telephonicVerifyProvider,
  updateProviderRating,
} from "../controllers/providerController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public browsing routes
router.get("/", getAllProviders);
router.get("/nearby", getNearbyProviders);

// Static subroutes (MUST precede /:id)
router.get("/admin/all", protect, authorize("admin"), getAllProvidersAdmin);

// Get logged-in provider's own profile by User ID
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const profile = await ServiceProviderProfile.findOne({ userId: req.params.userId })
      .populate("servicesOffered")
      .populate("userId", "name email phone");

    if (!profile) {
      return res.status(404).json({ message: "Provider profile not found" });
    }
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch provider profile" });
  }
});

// Protected mutations & parameterized routes
router.post("/", protect, createProviderProfile);
router.get("/:id", getProviderById);
router.put("/:id", protect, updateProviderProfile);
router.delete("/:id", protect, authorize("admin"), deleteProviderProfile);

// Specific action routes
router.patch("/:id/verify", protect, authorize("admin"), verifyProvider);
router.patch("/:id/telephonic-verify", protect, authorize("admin"), telephonicVerifyProvider);
router.patch("/:id/rating", protect, updateProviderRating);

export default router;