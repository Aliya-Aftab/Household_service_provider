import User from "../models/User.js";
import ServiceProviderProfile from "../models/ServiceProvider.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* REVERSE GEOCODE lat/lng → city name via Nominatim (server-side) */
const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SmartService/1.0 (household-service-app)' }
    });
    const data = await res.json();
    return (
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.county ||
      data?.address?.state ||
      'Unknown Location'
    );
  } catch (e) {
    console.warn('Reverse geocoding failed:', e.message);
    return null;
  }
};

/* CREATE USER (REGISTER) */
export const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    // Check if user exists by either phone OR email
    const query = [];
    if (phone) query.push({ phone });
    if (email) query.push({ email });

    if (query.length > 0) {
      const existing = await User.findOne({ $or: query });
      if (existing) {
        return res.status(400).json({ message: "User with this email or phone already exists" });
      }
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret_key",
      { expiresIn: "7d" }
    );

    // Sanitize output so hashed password is never transmitted
    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      message: "Registration successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Registration failed" });
  }
};

/* LOGIN USER */
export const loginUser = async (req, res) => {
  try {
    const { phone, email, password, lat, lng, locationName } = req.body;

    if (!password || (!phone && !email)) {
      return res.status(400).json({ message: "Please provide login identifier and password" });
    }

    // Allow login by either phone OR email
    const user = await User.findOne(
      phone ? { phone } : { email }
    );

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret_key",
      { expiresIn: "7d" }
    );

    // Update location for users if coordinates provided
    if (lat && lng) {
      const resolvedName = locationName || await reverseGeocode(lat, lng);

      user.location = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
      if (resolvedName) user.locationName = resolvedName;
      await user.save();

      // If provider, also sync provider profile
      if (user.role === "provider") {
        await ServiceProviderProfile.findOneAndUpdate(
          { userId: user._id },
          {
            location: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            ...(resolvedName && { locationName: resolvedName })
          }
        );
      }
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Login failed" });
  }
};

/* GET ALL USERS (only active, non-deleted, excluding password hash) */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: { $ne: false } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE USER (soft-delete — sets isActive=false) */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE LOCATION FOR ALREADY LOGGED-IN USER */
export const updateUserLocation = async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;

    if (!userId || !lat || !lng) {
      return res.status(400).json({ message: "userId, lat, lng are required" });
    }

    const resolvedName = await reverseGeocode(lat, lng);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        ...(resolvedName && { locationName: resolvedName })
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Also update provider profile if applicable
    if (user.role === "provider") {
      await ServiceProviderProfile.findOneAndUpdate(
        { userId: user._id },
        {
          location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          ...(resolvedName && { locationName: resolvedName })
        }
      );
    }

    res.json({ message: "Location updated", locationName: resolvedName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};