import mongoose from "mongoose";
import ServiceProviderProfile from "../models/ServiceProvider.js";

// Helper to resolve a clean city name from provider profile
const ensureCityName = (providerObj) => {
  if (
    providerObj.locationName &&
    !providerObj.locationName.startsWith("GPS:") &&
    providerObj.locationName !== "undefined" &&
    providerObj.locationName !== "Live Location Pending"
  ) {
    return providerObj.locationName;
  }
  return "Verified Location";
};

// Haversine formula to calculate distance between two coordinates in kilometers
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
};

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

    const pObj = provider.toObject();
    pObj.locationName = ensureCityName(pObj);

    return res.json(pObj);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* GET ALL VERIFIED PROVIDERS (public - sorted by Bayesian score with optional distance) */
export const getAllProviders = async (req, res) => {
  try {
    const { lng, lat } = req.query;
    const providers = await ServiceProviderProfile.find({ isVerified: true })
      .populate("userId", "-password")
      .populate("servicesOffered")
      .sort({ bayesianScore: -1, avgRating: -1 });

    const results = providers.map((p) => {
      const pObj = p.toObject();
      pObj.locationName = ensureCityName(pObj);
      const coords = p.location?.coordinates;
      if (lng && lat && Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        pObj.distanceKm = haversineDistanceKm(parseFloat(lat), parseFloat(lng), coords[1], coords[0]);
      }
      return pObj;
    });

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* GET ALL PROVIDERS FOR ADMIN (includes unverified/pending) */
export const getAllProvidersAdmin = async (req, res) => {
  try {
    const providers = await ServiceProviderProfile.find()
      .populate("userId", "-password")
      .populate("servicesOffered")
      .sort({ createdAt: -1 });

    const results = providers.map((p) => {
      const pObj = p.toObject();
      pObj.locationName = ensureCityName(pObj);
      return pObj;
    });

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* GET NEARBY PROVIDERS (filtered by km distance limit and service keyword) */
export const getNearbyProviders = async (req, res) => {
  try {
    const { lng, lat, categoryId, service, maxKm } = req.query;

    if (!lng || !lat) {
      const all = await ServiceProviderProfile.find({ isVerified: true })
        .populate("userId", "-password")
        .populate("servicesOffered")
        .sort({ bayesianScore: -1, avgRating: -1 });

      const formatted = all.map((p) => {
        const pObj = p.toObject();
        pObj.locationName = ensureCityName(pObj);
        return pObj;
      });

      return res.json(formatted);
    }

    const userLng = parseFloat(lng);
    const userLat = parseFloat(lat);
    const limitKm = maxKm ? parseFloat(maxKm) : 25; // Default system limit: 25 km

    // Fetch verified providers with populated users and categories
    const providers = await ServiceProviderProfile.find({ isVerified: true })
      .populate("userId", "-password")
      .populate("servicesOffered");

    const results = [];

    for (const p of providers) {
      const coords = p.location?.coordinates;
      let dist = null;

      if (Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const [pLng, pLat] = coords;
        dist = haversineDistanceKm(userLat, userLng, pLat, pLng);
      }

      // Include provider if within distance limit
      if (dist !== null && dist <= limitKm) {
        const pObj = p.toObject();
        pObj.locationName = ensureCityName(pObj);
        pObj.distanceKm = dist;
        results.push(pObj);
      }
    }

    // Filter by category if specified
    let filtered = results;
    if (categoryId && categoryId !== "All") {
      filtered = filtered.filter((p) =>
        p.servicesOffered?.some(
          (s) =>
            s._id?.toString() === categoryId ||
            s.toString() === categoryId ||
            s.name?.toLowerCase() === categoryId.toLowerCase()
        )
      );
    }

    // Filter by service keyword
    if (service && service.trim()) {
      const q = service.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const catMatch = p.servicesOffered?.some(
          (s) =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.description && s.description.toLowerCase().includes(q))
        );
        const skillMatch = p.skills?.some((sk) => sk.toLowerCase().includes(q));
        const nameMatch = p.userId?.name?.toLowerCase().includes(q);
        return catMatch || skillMatch || nameMatch;
      });
    }

    // Sort by nearest distance first
    filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

    return res.json(filtered);
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

/* TELEPHONIC VERIFY PROVIDER PROFILE (ADMIN ONLY) */
export const telephonicVerifyProvider = async (req, res) => {
  try {
    const provider = await ServiceProviderProfile.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    provider.telephonicVerified = true;
    await provider.save();

    return res.json({ message: "Provider telephonic verification successful", provider });
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