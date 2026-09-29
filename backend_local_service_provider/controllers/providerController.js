import ServiceProviderProfile from "../models/ServiceProvider.js";

/* CREATE PROVIDER PROFILE */
export const createProviderProfile = async (req, res) => {
  try {
    const profile = await ServiceProviderProfile.create(req.body);
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET PROVIDER PROFILE BY ID OR USER ID */
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Search by ServiceProviderProfile _id first, fallback to matching userId
    let provider = await ServiceProviderProfile
      .findById(id)
      .populate("userId")
      .populate("servicesOffered");

    if (!provider) {
      provider = await ServiceProviderProfile
        .findOne({ userId: id })
        .populate("userId")
        .populate("servicesOffered");
    }

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const pObj = provider.toObject();
    pObj.locationName = ensureCityName(pObj);

    res.json(pObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

/* GET ALL VERIFIED PROVIDERS (public - only show verified, with optional distance calculation) */
export const getAllProviders = async (req, res) => {
  try {
    const { lng, lat } = req.query;
    const providers = await ServiceProviderProfile
      .find({ isVerified: true })
      .populate("userId", "-password")
      .populate("servicesOffered");

    const results = providers.map((p) => {
      const pObj = p.toObject();
      pObj.locationName = ensureCityName(pObj);
      const coords = p.location?.coordinates;
      if (lng && lat && Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        pObj.distanceKm = haversineDistanceKm(parseFloat(lat), parseFloat(lng), coords[1], coords[0]);
      }
      return pObj;
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET ALL PROVIDERS FOR ADMIN (includes unverified/pending) */
export const getAllProvidersAdmin = async (req, res) => {
  try {
    const providers = await ServiceProviderProfile
      .find()
      .populate("userId")
      .populate("servicesOffered");

    const results = providers.map((p) => {
      const pObj = p.toObject();
      pObj.locationName = ensureCityName(pObj);
      return pObj;
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET NEARBY PROVIDERS (filtered by km distance limit and service keyword) */
export const getNearbyProviders = async (req, res) => {
  try {
    const { lng, lat, categoryId, service, maxKm } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const userLng = parseFloat(lng);
    const userLat = parseFloat(lat);
    const limitKm = maxKm ? parseFloat(maxKm) : 25; // Default system limit: 25 km

    // Fetch only verified providers with populated user and categories
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

      // Include provider if within distance limit (or if no coordinates, keep dist as null)
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

    // Filter by typed service keyword if specified (e.g. "carpenter", "plumber", "cleaner")
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

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE PROVIDER PROFILE */
export const updateProviderProfile = async (req, res) => {
  try {
    const updated = await ServiceProviderProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE PROVIDER PROFILE */
export const deleteProviderProfile = async (req, res) => {
  try {
    const deleted = await ServiceProviderProfile.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.json({ message: "Provider deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* VERIFY PROVIDER PROFILE (ADMIN ONLY) */
export const verifyProvider = async (req, res) => {
  try {
    const provider = await ServiceProviderProfile.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    provider.isVerified = true;
    provider.verifiedByAdmin = true;

    await provider.save();

    res.json({ message: "Provider verified successfully", provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    res.json({ message: "Provider telephonic verification successful", provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE PROVIDER RATING (WITH BAYESIAN RANKING) */
export const updateProviderRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const provider = await ServiceProviderProfile.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // 1. Calculate standard average
    const currentTotalScore = provider.avgRating * provider.totalRatings;
    provider.totalRatings += 1;
    provider.avgRating = (currentTotalScore + rating) / provider.totalRatings;

    // 2. Apply Bayesian Weighted Ranking
    const v = provider.totalRatings;
    const m = 10; 
    const R = provider.avgRating;
    const C = 3.5; 

    provider.bayesianScore = ((v / (v + m)) * R) + ((m / (v + m)) * C);

    await provider.save();
    res.json(provider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};