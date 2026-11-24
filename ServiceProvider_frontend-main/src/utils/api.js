import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://household-service-provider.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
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

  let resolvedCity = p.locationName || p.city;

  if (
    !resolvedCity ||
    resolvedCity.startsWith("GPS:") ||
    resolvedCity === "undefined" ||
    resolvedCity === "Live Location Pending"
  ) {
    resolvedCity = "Verified Location";
  }

  const distanceText =
    p.distanceKm !== undefined && p.distanceKm !== null
      ? `${p.distanceKm} km away`
      : resolvedCity;

  let mappedAvailability = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (Array.isArray(p.availability) && p.availability.length > 0) {
    mappedAvailability = p.availability
      .map((a) => {
        const d = typeof a === "string" ? a : a?.day || "";
        return d.substring(0, 3);
      })
      .filter(Boolean);
  }

  const isRec = Boolean(
    p.isRecommended ||
      (p.bayesianScore && p.bayesianScore >= 4.0) ||
      (p.avgRating && p.avgRating >= 4.5 && p.totalRatings >= 2)
  );

  return {
    id: p._id,
    userDocId: p.userId?._id || p.userId,
    name: p.userId?.name || "Verified Professional",
    phone: p.userId?.phone || "N/A",
    email: p.userId?.email || "N/A",
    category: catName,
    categoryId: catId,
    rating: Number(p.avgRating ? Number(p.avgRating).toFixed(1) : 4.5),
    reviews: p.totalRatings || 0,
    price: catObj?.basePrice || 299,
    experience: `${p.experienceYears || 5} years`,
    image:
      p.profilePicture &&
      p.profilePicture !== "default_pic_url" &&
      (p.profilePicture.startsWith("http") || p.profilePicture.startsWith("data:"))
        ? p.profilePicture
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    aadhaarImage: p.aadhaarImage,
    certificates: p.certificates || [],
    location: resolvedCity,
    locationName: resolvedCity,
    city: resolvedCity,
    coordinates: p.location?.coordinates || null,
    distance: distanceText,
    distanceKm: p.distanceKm !== undefined && p.distanceKm !== null ? p.distanceKm : null,
    recommended: isRec,
    verified: Boolean(p.isVerified || p.verifiedByAdmin),
    telephonicVerified: p.telephonicVerified,
    joinedAt: p.createdAt
      ? new Date(p.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A",
    about: `Specialist with ${p.experienceYears || 5} years of verified industry experience.`,
    availability: mappedAvailability,
    reviewsList: [],
    services:
      Array.isArray(p.skills) && p.skills.length > 0
        ? p.skills.map((s) => ({
            name: s,
            price: catObj?.basePrice || 299,
            categoryId: catId,
          }))
        : [{ name: catName, price: catObj?.basePrice || 299, categoryId: catId }],
  };
};

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
    customerName: b.customerId?.name || "Customer",
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