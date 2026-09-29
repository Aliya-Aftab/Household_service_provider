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

    res.json(provider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET ALL VERIFIED PROVIDERS (public - only show verified) */
export const getAllProviders = async (req, res) => {
  try {
    const providers = await ServiceProviderProfile
      .find({ isVerified: true })
      .populate("userId")
      .populate("servicesOffered");

    res.json(providers);
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

    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET NEARBY PROVIDERS */
export const getNearbyProviders = async (req, res) => {
  try {
    const { lng, lat, categoryId } = req.query;

    const query = {
      isVerified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 5000 // 5 km
        }
      }
    };

    if (categoryId) {
      query.servicesOffered = categoryId;
    }

    const providers = await ServiceProviderProfile.find(query).populate("userId","-password");

    res.json(providers);
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