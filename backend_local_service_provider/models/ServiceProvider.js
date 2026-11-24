import mongoose from "mongoose";

const DEFAULT_COORDS = [83.3732, 26.7606]; // [lng, lat] fallback

const ServiceProviderProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  aadhaarImage: { type: String, required: true }, // cloud URL
  profilePicture: { type: String }, // cloud URL
  certificates: [{ type: String }], // array of cloud URLs
  isVerified: { type: Boolean, default: false },
  verifiedByAdmin: { type: Boolean, default: false },
  telephonicVerified: { type: Boolean, default: false },

  servicesOffered: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
    },
  ],

  availability: [
    {
      day: String, // Monday
      startTime: String,
      endTime: String,
    },
  ],
  experienceYears: { type: Number, default: 0 },

  skills: [String],

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: DEFAULT_COORDS }, // [lng, lat]
  },
  locationName: { type: String, default: "Verified Location" },

  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },

  recommendationScore: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 0 },
  bayesianScore: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

// Guarantee valid GeoJSON Point before saving to 2dsphere index
ServiceProviderProfileSchema.pre("validate", function () {
  const coords = this.location?.coordinates;
  const isValid =
    Array.isArray(coords) &&
    coords.length === 2 &&
    coords.every((n) => typeof n === "number" && !Number.isNaN(n));

  if (!isValid) {
    this.location = { type: "Point", coordinates: DEFAULT_COORDS };
  }
});

ServiceProviderProfileSchema.index({ location: "2dsphere" });

export default mongoose.model("ServiceProviderProfile", ServiceProviderProfileSchema);