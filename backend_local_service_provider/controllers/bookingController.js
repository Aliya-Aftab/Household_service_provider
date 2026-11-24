import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import ServiceProviderProfile from "../models/ServiceProvider.js";

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

    // Auto-create notifications for customer and provider (non-blocking)
    try {
      const serviceName = populated?.serviceCategory?.name || "a service";

      // Resolve provider's User._id in case providerId is a ServiceProviderProfile._id
      let providerUserId = providerId;
      if (mongoose.Types.ObjectId.isValid(providerId)) {
        const provProfile = await ServiceProviderProfile.findById(providerId).select("userId");
        if (provProfile?.userId) {
          providerUserId = provProfile.userId;
        }
      }

      await Notification.insertMany([
        {
          userId: customerId,
          message: `Your booking for ${serviceName} has been placed.`,
        },
        {
          userId: providerUserId,
          message: `You have a new booking request for ${serviceName}.`,
        },
      ]);
    } catch (notifErr) {
      console.error("Notification creation skipped:", notifErr.message);
    }

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

    // Notify customer about status change (non-blocking)
    try {
      const targetUserId = booking.customerId || booking.userId;
      if (targetUserId) {
        await Notification.create({
          userId: targetUserId,
          message: `Your booking status has been updated to "${booking.status}".`,
        });
      }
    } catch (notifErr) {
      console.error("Status notification skipped:", notifErr.message);
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
      $or: [{ customerId: id }, { userId: id }],
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

    // Match bookings saved under either the User._id or ServiceProviderProfile._id
    const providerProfile = await ServiceProviderProfile.findOne({ userId: id }).select("_id");
    const matchIds = [id];
    if (providerProfile?._id) {
      matchIds.push(providerProfile._id);
    }

    const bookings = await Booking.find({ providerId: { $in: matchIds } })
      .populate("customerId", "name email phone")
      .populate("serviceCategory")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("getProviderBookings Error:", err);
    return res.status(500).json({ message: err.message || "Failed to fetch provider bookings" });
  }
};

/* GET ALL BOOKINGS (ADMIN OVERVIEW) */
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId", "name email phone")
      .populate("providerId", "name email phone")
      .populate("serviceCategory")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("getAllBookings Error:", err);
    return res.status(500).json({ message: err.message || "Failed to fetch all bookings" });
  }
};