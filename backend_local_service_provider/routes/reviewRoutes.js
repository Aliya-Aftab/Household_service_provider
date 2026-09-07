import express from "express";
import { addReview } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", addReview);

export default router;