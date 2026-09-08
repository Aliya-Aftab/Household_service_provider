import mongoose from "mongoose";
import ServiceProviderProfile from "../models/ServiceProvider.js";

/* CREATE PROVIDER PROFILE */
export const createProviderProfile = async (req, res) => {
  try {
    const profile = await ServiceProviderProfile.create(req.body);
    return res.status(201).json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* GET PROVIDER PROFILE BY ID OR USER ID */
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ message: "Invalid provider ID provided." });
    }

    const isHexId = mongoose.Types.ObjectId.isValid(id);
    let provider = null;

    if (isHexId) {
      provider = await ServiceProviderProfile.findById(id)
        .populate("userId", "-password")
        .populate("servicesOffered");
    }

    // Fallback: search by userId reference
    if (!provider && isHexId) {
      provider = await ServiceProviderProfile.findOne({ userId: id })
        .populate("userId", "-password")
        .populate("servicesOffered");
    }

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    return res.json(provider);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* GET ALL PROVIDERS */
export const getAllProviders = async (req, res) => {
  try {
    const providers = await ServiceProviderProfile.find()
      .populate("userId", "-password")
      .populate("servicesOffered")
      .sort({ bayesianScore: -1, avgRating: -1 });

    return res.json(providers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* GET NEARBY PROVIDERS */
export const getNearbyProviders = async (req, res) => {
  try {
    const { lng, lat, categoryId } = req.query;

    if (!lng || !lat) {
      // If coordinates not passed, return default active providers
      const all = await ServiceProviderProfile.find()
        .populate("userId", "-password")
        .populate("servicesOffered");
      return res.json(all);
    }

    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 15000, // 15 km
        },
      },
    };

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.servicesOffered = categoryId;
    }

    let providers;
    try {
      providers = await ServiceProviderProfile.find(query).populate("userId", "-password");
    } catch (geoErr) {
      // Fallback if 2dsphere index is absent on the collection
      providers = await ServiceProviderProfile.find().populate("userId", "-password");
    }

    return res.json(providers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* UPDATE PROVIDER PROFILE */
export const updateProviderProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const updated = await ServiceProviderProfile.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Provider not found" });
    }

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* DELETE PROVIDER PROFILE */
export const deleteProviderProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const deleted = await ServiceProviderProfile.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Provider not found" });
    }

    return res.json({ message: "Provider deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* VERIFY PROVIDER PROFILE (ADMIN ONLY) */
export const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    let provider = await ServiceProviderProfile.findById(id);
    if (!provider) {
      provider = await ServiceProviderProfile.findOne({ userId: id });
    }

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    provider.isVerified = true;
    provider.verifiedByAdmin = true;

    await provider.save();
    return res.json({ message: "Provider verified successfully", provider });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* UPDATE PROVIDER RATING (WITH BAYESIAN RANKING) */
export const updateProviderRating = async (req, res) => {
  try {
    const numericRating = Number(req.body.rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    let provider = await ServiceProviderProfile.findById(id);
    if (!provider) {
      provider = await ServiceProviderProfile.findOne({ userId: id });
    }

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const prevCount = provider.totalRatings || 0;
    const prevAvg = provider.avgRating || 0;

    const newTotal = prevCount + 1;
    const newAvg = ((prevAvg * prevCount) + numericRating) / newTotal;

    provider.totalRatings = newTotal;
    provider.avgRating = Number(newAvg.toFixed(2));

    // Bayesian Weighted Ranking: m = 5, C = 3.5
    const v = newTotal;
    const m = 5;
    const R = provider.avgRating;
    const C = 3.5;

    provider.bayesianScore = Number((((v / (v + m)) * R) + ((m / (v + m)) * C)).toFixed(2));
    provider.isRecommended = provider.bayesianScore >= 4.0;

    await provider.save();
    return res.json(provider);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};