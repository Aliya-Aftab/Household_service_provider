import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* CREATE USER */
export const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : null;

    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* LOGIN USER */
export const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // check user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET ALL USERS */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};