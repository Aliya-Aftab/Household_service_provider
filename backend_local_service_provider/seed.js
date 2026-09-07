import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import ServiceProviderProfile from "./models/ServiceProvider.js";
import ServiceCategory from "./models/ServiceCategory.js";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    // Clear existing records to avoid duplicate key errors on email/phone
    await User.deleteMany({});
    await ServiceProviderProfile.deleteMany({});
    await ServiceCategory.deleteMany({});

    console.log("Existing collections cleared.");

    // 1. Seed Categories
    const categories = await ServiceCategory.insertMany([
      { name: "Electrician", categoryName: "Electrician", description: "Electrical installations and repairs", basePrice: 299 },
      { name: "Beautician", categoryName: "Beautician", description: "Skincare, hair and makeup services", basePrice: 499 },
      { name: "Carpenter", categoryName: "Carpenter", description: "Woodworking and furniture repair", basePrice: 399 },
      { name: "AC Repair", categoryName: "AC Repair", description: "Air conditioner servicing and repair", basePrice: 349 },
      { name: "Plumber", categoryName: "Plumber", description: "Pipe leaks and plumbing fittings", basePrice: 249 },
      { name: "Cleaner", categoryName: "Cleaner", description: "Deep home and office cleaning", basePrice: 199 }
    ]);

    const catMap = {};
    categories.forEach((cat) => {
      const key = cat.name || cat.categoryName;
      catMap[key] = cat._id;
    });

    // 2. Seed Providers (with valid 'provider' role and unique phones)
    const providerRecords = [
      {
        user: { name: "Rajesh Kumar", email: "rajesh@example.com", password: "Password@123", role: "provider", phone: "9876543210" },
        profile: {
          aadhaarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
          isVerified: true,
          verifiedByAdmin: true,
          category: "Electrician",
          experienceYears: 8,
          skills: ["Switchboard Repair", "Fan Installation", "Wiring Work", "MCB/Fuse Replacement"],
          location: { type: "Point", coordinates: [77.6245, 12.9352] },
          avgRating: 4.8,
          totalRatings: 234,
          bayesianScore: 4.75
        }
      },
      {
        user: { name: "Priya Sharma", email: "priya@example.com", password: "Password@123", role: "provider", phone: "9876543211" },
        profile: {
          aadhaarImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
          isVerified: true,
          verifiedByAdmin: true,
          category: "Beautician",
          experienceYears: 6,
          skills: ["Facial Treatment", "Hair Styling", "Bridal Makeup", "Manicure & Pedicure"],
          location: { type: "Point", coordinates: [77.6412, 12.9716] },
          avgRating: 4.9,
          totalRatings: 312,
          bayesianScore: 4.85
        }
      },
      {
        user: { name: "Arun Verma", email: "arun@example.com", password: "Password@123", role: "provider", phone: "9876543212" },
        profile: {
          aadhaarImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
          isVerified: true,
          verifiedByAdmin: true,
          category: "Carpenter",
          experienceYears: 10,
          skills: ["Furniture Repair", "Door Fitting", "Custom Shelving"],
          location: { type: "Point", coordinates: [77.5946, 12.9716] },
          avgRating: 4.7,
          totalRatings: 156,
          bayesianScore: 4.65
        }
      },
      {
        user: { name: "Vikash Singh", email: "vikash@example.com", password: "Password@123", role: "provider", phone: "9876543213" },
        profile: {
          aadhaarImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
          isVerified: true,
          verifiedByAdmin: true,
          category: "AC Repair",
          experienceYears: 7,
          skills: ["AC Servicing", "Gas Refill", "Compressor Check"],
          location: { type: "Point", coordinates: [77.6101, 12.925] },
          avgRating: 4.8,
          totalRatings: 198,
          bayesianScore: 4.72
        }
      }
    ];

    for (const item of providerRecords) {
      const createdUser = await User.create(item.user);
      await ServiceProviderProfile.create({
        userId: createdUser._id,
        aadhaarImage: item.profile.aadhaarImage,
        isVerified: item.profile.isVerified,
        verifiedByAdmin: item.profile.verifiedByAdmin,
        servicesOffered: [catMap[item.profile.category]],
        experienceYears: item.profile.experienceYears,
        skills: item.profile.skills,
        location: item.profile.location,
        avgRating: item.profile.avgRating,
        totalRatings: item.profile.totalRatings,
        bayesianScore: item.profile.bayesianScore
      });
    }

    // 3. Seed UI customer Amit (role: "customer")
    await User.create({
      name: "Amit",
      email: "amit@example.com",
      password: "Password@123",
      role: "customer",
      phone: "9123456780"
    });

    console.log("Database seeded successfully with 4 providers and customer Amit!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seed();