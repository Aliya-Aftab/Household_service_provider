import mongoose from "mongoose";
const ComplaintSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  },

  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  against: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  description: { type: String, required: true },

  status: {
    type: String,
    enum: ["open", "in_review", "resolved"],
    default: "open"
  },

  adminRemarks: String,

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Complaint", ComplaintSchema);