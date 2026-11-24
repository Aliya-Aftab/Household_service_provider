import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "30d", // MongoDB TTL index: auto-deletes after 30 days
  },
});

export default mongoose.model("Notification", NotificationSchema);