import mongoose from "mongoose";
const ReviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },

  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,

  createdAt: { type: Date, default: Date.now }
});

ReviewSchema.index({ bookingId: 1 }, { unique: true });


export default mongoose.model("Review", ReviewSchema);