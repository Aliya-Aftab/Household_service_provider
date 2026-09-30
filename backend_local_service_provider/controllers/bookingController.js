import mongoose from "mongoose";
import Booking from "../models/Booking.js";

/* CREATE BOOKING */
export const createBooking = async (req, res) => {
  try {
    const { customerId, providerId, serviceCategory, bookingDate, address, price } = req.body;

    if (!customerId || !providerId) {
      return res.status(400).json({ message: "Customer ID and Provider ID are required." });
    }

    const bookingPayload = {
      ...req.body,
      customerId,
      providerId,
      bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
      price: Number(price) || 299,
      status: req.body.status || "pending",
    };

    const booking = await Booking.create(bookingPayload);
    const populated = await Booking.findById(booking._id)
      .populate("providerId", "name email phone")
      .populate("serviceCategory");

    return res.status(201).json(populated || booking);
  } catch (err) {
    console.error("Booking Creation Error:", err);
    return res.status(500).json({ message: err.message || "Failed to create booking" });
  }
};

/* UPDATE STATUS (CANCEL / COMPLETE / CONFIRM) */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID format" });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { new: true }
    )
      .populate("providerId", "name email phone")
      .populate("serviceCategory");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update booking status" });
  }
};

/* GET BOOKINGS FOR A CUSTOMER */
export const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json([]);
    }

    const bookings = await Booking.find({
      $or: [{ customerId: id }, { userId: id }]
    })
      .populate("providerId", "name email phone")
      .populate("serviceCategory")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch bookings" });
  }
};

/* GET BOOKINGS FOR A PROVIDER */
export const getProviderBookings = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json([]);
    }

    const bookings = await Booking.find({ providerId: id })
      .populate("customerId", "name email phone")
      .populate("userId", "name email phone")
      .populate("serviceCategory")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch provider bookings" });
  }
};

/* GET ALL BOOKINGS (ADMIN OVERVIEW) */
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId", "name email phone")
      .populate("userId", "name email phone")
      .populate("providerId", "name email phone")
      .populate("serviceCategory")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch all bookings" });
  }
};