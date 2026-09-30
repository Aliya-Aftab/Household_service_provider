import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ Error: Could not find MONGO_URL in your .env file.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB Atlas...");

    const adminEmail = "admin@smartservice.com";
    const adminPassword = "AdminPassword123";

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      existingUser.role = "admin";
      await existingUser.save();
      console.log(`✅ Existing user "${adminEmail}" promoted to admin!`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await User.create({
        name: "System Admin",
        email: adminEmail,
        phone: "9999999999",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("✅ Admin account created successfully!");
    }

    console.log("-----------------------------------------");
    console.log("Admin Credentials:");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("-----------------------------------------");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to seed admin:", err.message);
    process.exit(1);
  }
};

createAdmin();