import express from "express";
import {
  createProviderProfile,
  getNearbyProviders,
  getAllProviders,
  getProviderById,
  updateProviderProfile,
  deleteProviderProfile,
  verifyProvider,
  updateProviderRating,
} from "../controllers/providerController.js";

const router = express.Router();

// Base collection routes
router.post("/", createProviderProfile);
router.get("/", getAllProviders);

// Static subroutes MUST precede parameterized /:id routes
router.get("/nearby", getNearbyProviders);

// Parameterized item routes
router.get("/:id", getProviderById);
router.put("/:id", updateProviderProfile);
router.delete("/:id", deleteProviderProfile);

// Specific action routes
router.patch("/:id/verify", verifyProvider);
router.patch("/:id/rating", updateProviderRating);

export default router;