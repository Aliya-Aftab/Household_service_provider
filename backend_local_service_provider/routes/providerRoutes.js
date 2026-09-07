import express from "express";
import {
  createProviderProfile,
  getNearbyProviders,
  getAllProviders,
  getProviderById,
  updateProviderProfile,
  deleteProviderProfile,
  verifyProvider,
  updateProviderRating
} from "../controllers/providerController.js";

const router = express.Router();

router.post("/", createProviderProfile);
router.get("/", getAllProviders);
router.get("/nearby", getNearbyProviders);
router.get("/:id", getProviderById);
router.put("/:id", updateProviderProfile);
router.delete("/:id", deleteProviderProfile);

// special routes
router.patch("/:id/verify", verifyProvider);
router.patch("/:id/rating", updateProviderRating);

export default router;