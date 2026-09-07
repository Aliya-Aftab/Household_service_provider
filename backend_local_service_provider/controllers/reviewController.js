import Review from "../models/Review_Rating.js";
import ServiceProviderProfile from "../models/ServiceProvider.js";

export const addReview = async (req, res) => {
  try {
    const review = await Review.create(req.body);

    const provider = await ServiceProviderProfile.findOne({
      userId: review.providerId
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Update ratings safely
    const previousTotal = provider.totalRatings || 0;
    const previousAvg = provider.avgRating || 0;

    provider.totalRatings = previousTotal + 1;
    provider.avgRating =
      (previousAvg * previousTotal + review.rating) /
      provider.totalRatings;

    await provider.save();

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};