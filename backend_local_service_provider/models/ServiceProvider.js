import mongoose from "mongoose";
const ServiceProviderProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  aadhaarImage: { type: String, required: true }, // cloud URL
  isVerified: { type: Boolean, default: false },
  verifiedByAdmin: { type: Boolean, default: false },

  servicesOffered: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceCategory"
  }],

  availability: [{
    day: String, // Monday
    startTime: String,
    endTime: String
  }],
  experienceYears: { type: Number, default: 0 },

  skills: [String],

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number]} // [lng, lat]
  },

  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },

 recommendationScore: { type: Number, default: 0 }, // ML-friendly
  qualityScore: { type: Number, default: 0 }, // ML output
  bayesianScore: { type: Number, default: 0 }, // Added for Slide 7 Ranking Engine

  createdAt: { type: Date, default: Date.now }
});
ServiceProviderProfileSchema.index({ location: "2dsphere" });
export default mongoose.model("ServiceProviderProfile", ServiceProviderProfileSchema);