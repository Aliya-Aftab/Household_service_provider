import express from "express";
import { 
  createBooking, 
  updateBookingStatus,
  getUserBookings,
  getProviderBookings,
  getAllBookings
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", createBooking);
router.get("/", getAllBookings); // Serves GET /api/bookings
router.patch("/:id/status", updateBookingStatus);

router.get("/user/:id", getUserBookings);
router.get("/provider/:id", getProviderBookings);

export default router;