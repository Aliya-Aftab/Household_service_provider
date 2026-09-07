import mongoose from "mongoose";
const PaymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,

  amount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created"
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", PaymentSchema);