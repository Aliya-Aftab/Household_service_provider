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
  updateProviderRating
} from "../controllers/providerController.js";

const router = express.Router();

router.post("/", createProviderProfile);
router.get("/", getAllProviders);            // public - verified only
router.get("/admin/all", getAllProvidersAdmin); // admin - all providers
router.get("/nearby", getNearbyProviders);
router.get("/:id", getProviderById);
router.put("/:id", updateProviderProfile);
router.delete("/:id", deleteProviderProfile);

// special routes
router.patch("/:id/verify", verifyProvider);
router.patch("/:id/telephonic-verify", telephonicVerifyProvider);
router.patch("/:id/rating", updateProviderRating);

export default router;