import express from "express";
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

const router = express.Router();

// Base collection routes
router.post("/", createProviderProfile);
router.get("/", getAllProviders); // Public - verified only

// Static subroutes (MUST precede parameterized /:id routes)
router.get("/admin/all", getAllProvidersAdmin); // Admin - all providers
router.get("/nearby", getNearbyProviders);

// Parameterized item routes
router.get("/:id", getProviderById);
router.put("/:id", updateProviderProfile);
router.delete("/:id", deleteProviderProfile);

// Specific action routes
router.patch("/:id/verify", verifyProvider);
router.patch("/:id/telephonic-verify", telephonicVerifyProvider);
router.patch("/:id/rating", updateProviderRating);

export default router;