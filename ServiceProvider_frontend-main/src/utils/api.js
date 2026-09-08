import axios from "axios";

const API = axios.create({
  baseURL: "https://household-service-provider.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to requests
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Intercept 401 Unauthorized to clean stale sessions
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

export const transformProvider = (p) => {
  if (!p) return null;

  const catObj = p.servicesOffered?.[0];
  const catName = catObj?.name || catObj?.categoryName || "General";
  const catId = catObj?._id || catObj;

  // Extract schedule days if available in MongoDB
  let mappedAvailability = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (Array.isArray(p.availability) && p.availability.length > 0) {
    mappedAvailability = p.availability.map((a) => {
      const d = typeof a === "string" ? a : a?.day || "";
      return d.substring(0, 3);
    }).filter(Boolean);
  }

  const isRec = Boolean(
    p.isRecommended ||
    (p.bayesianScore && p.bayesianScore >= 4.0) ||
    (p.avgRating && p.avgRating >= 4.5 && p.totalRatings >= 2)
  );

  return {
    id: p._id,
    userDocId: p.userId?._id || p.userId, // User ID required by Booking schema
    name: p.userId?.name || "Verified Professional",
    category: catName,
    categoryId: catId,
    rating: Number(p.avgRating ? Number(p.avgRating).toFixed(1) : 4.5),
    reviews: p.totalRatings || 0,
    price: catObj?.basePrice || 299,
    experience: `${p.experienceYears || 3} years`,
    image: p.aadhaarImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    location: p.city || "Gorakhpur",
    distance: "2.5 km",
    recommended: isRec,
    verified: Boolean(p.isVerified || p.verifiedByAdmin),
    about: `Specialist with ${p.experienceYears || 3} years of verified industry experience in household maintenance.`,
    availability: mappedAvailability,
    reviewsList: [],
    services: (Array.isArray(p.skills) && p.skills.length > 0)
      ? p.skills.map((s) => ({
          name: s,
          price: catObj?.basePrice || 299,
          categoryId: catId,
        }))
      : [{ name: catName, price: catObj?.basePrice || 299, categoryId: catId }],
  };
};

// Adapter: Maps backend Mongoose Booking document to props expected by Dashboard UI
export const transformBooking = (b) => {
  if (!b) return null;

  const dateObj = b.bookingDate ? new Date(b.bookingDate) : new Date(b.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    id: b._id,
    providerId: b.providerId?._id || b.providerId,
    providerName: b.providerId?.name || "Professional",
    category: b.serviceCategory?.name || b.serviceCategory?.categoryName || "Service",
    service: b.serviceCategory?.name || "Household Maintenance",
    date: formattedDate,
    time: b.timeSlot?.startTime || "10:00 AM",
    price: b.price || 299,
    status: (b.status || "pending").toLowerCase(),
  };
};

export default API;