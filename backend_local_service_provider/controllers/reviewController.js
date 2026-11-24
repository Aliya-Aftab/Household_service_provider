import mongoose from "mongoose";
import Review from "../models/Review_Rating.js";
import ServiceProviderProfile from "../models/ServiceProvider.js";

export const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
      return res.json([]);
    }

    const matchIds = [providerId];

    const profileById = await ServiceProviderProfile.findById(providerId).select("_id userId");
    if (profileById) {
      matchIds.push(profileById._id);
      if (profileById.userId) matchIds.push(profileById.userId);
    } else {
      const profileByUser = await ServiceProviderProfile.findOne({ userId: providerId }).select("_id userId");
      if (profileByUser?._id) {
        matchIds.push(profileByUser._id);
      }
    }

    const reviews = await Review.find({ providerId: { $in: matchIds } })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (err) {
    console.error("Get provider reviews error:", err);
    return res.status(500).json({ message: err.message || "Failed to fetch reviews" });
  }
};

export const addReview = async (req, res) => {
  try {
    const { bookingId, providerId, customerId, rating, comment, review: altReview } = req.body;

    if (!rating || (!providerId && !bookingId)) {
      return res.status(400).json({ message: "Provider and rating are required" });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const reviewData = {
      customerId,
      providerId,
      rating: numericRating,
      comment: comment || altReview || "Service completed satisfactorily.",
    };

    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      reviewData.bookingId = bookingId;
    }

    const createdReview = await Review.create(reviewData).catch((err) => {
      console.warn("Review record notice:", err.message);
      return null;
    });

    let provider = await ServiceProviderProfile.findById(providerId);
    if (!provider) {
      provider = await ServiceProviderProfile.findOne({ userId: providerId });
    }

    if (provider) {
      const prevTotal = provider.totalRatings || 0;
      const prevAvg = provider.avgRating || 0;

      const newTotal = prevTotal + 1;
      const newAvg = ((prevAvg * prevTotal) + numericRating) / newTotal;

      provider.totalRatings = newTotal;
      provider.avgRating = Number(newAvg.toFixed(2));

      const v = newTotal;
      const m = 5;
      const R = provider.avgRating;
      const C = 3.5;

      provider.bayesianScore = Number((((v / (v + m)) * R) + ((m / (v + m)) * C)).toFixed(2));
      provider.isRecommended = provider.bayesianScore >= 4.0;

      await provider.save();
    }

    return res.status(201).json(createdReview || { message: "Rating updated successfully" });
  } catch (err) {
    console.error("Add review error:", err);
    return res.status(500).json({ message: err.message || "Failed to submit review" });
  }
};