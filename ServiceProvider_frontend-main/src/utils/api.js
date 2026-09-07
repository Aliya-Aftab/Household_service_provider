import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const transformProvider = (p) => {
  const catObj = p.servicesOffered?.[0];
  const catName = catObj?.name || catObj?.categoryName || "General";
  const catId = catObj?._id || catObj;

  return {
    id: p._id,
    userDocId: p.userId?._id || p.userId, // provider User ID required by Booking schema
    name: p.userId?.name || "Verified Professional",
    category: catName,
    categoryId: catId,
    rating: p.avgRating || 4.5,
    reviews: p.totalRatings || 0,
    price: catObj?.basePrice || 299,
    experience: `${p.experienceYears || 5} years`,
    image: p.aadhaarImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    location: "Bangalore",
    distance: "2.5 km",
    recommended: (p.bayesianScore || 0) >= 4.5,
    verified: p.isVerified,
    about: `Specialist with ${p.experienceYears || 5} years of verified industry experience.`,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    reviewsList: [],
    services: (p.skills && p.skills.length > 0)
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
  const dateObj = b.bookingDate ? new Date(b.bookingDate) : new Date(b.createdAt);
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
    status: b.status || "pending",
  };
};

export default API;