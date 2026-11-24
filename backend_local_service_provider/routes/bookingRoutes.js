import express from "express";
import {
  createBooking,
  updateBookingStatus,
  getUserBookings,
  getProviderBookings,
  getAllBookings,
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/", protect, authorize("admin"), getAllBookings);
router.patch("/:id/status", protect, updateBookingStatus);

router.get("/user/:id", protect, getUserBookings);
router.get("/provider/:id", protect, getProviderBookings);

export default router;