import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const { phone, email, password } = req.body;

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

/* GET ALL USERS */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};