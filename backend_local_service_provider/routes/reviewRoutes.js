import express from "express";
import { addReview, getProviderReviews } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/provider/:providerId", getProviderReviews);
router.post("/", addReview);

export default router;