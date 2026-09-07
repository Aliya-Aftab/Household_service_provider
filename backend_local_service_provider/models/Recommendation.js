import mongoose from "mongoose";
const RecommendationSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  recommendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  message: String,

  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Recommendation", RecommendationSchema);