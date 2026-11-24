import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },

  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,

  createdAt: { type: Date, default: Date.now },
});

ReviewSchema.index(
  { bookingId: 1 },
  { unique: true, partialFilterExpression: { bookingId: { $type: "objectId" } } }
);

export default mongoose.model("Review", ReviewSchema);