import Booking from "../models/Booking.js";

/* CREATE BOOKING */
export const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE STATUS */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET BOOKINGS FOR A CUSTOMER */
export const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const bookings = await Booking.find({ customerId: id })
      .populate("providerId", "-password")
      .populate("serviceCategory")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET BOOKINGS FOR A PROVIDER */
export const getProviderBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const bookings = await Booking.find({ providerId: id })
      .populate("customerId", "-password")
      .populate("serviceCategory")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};