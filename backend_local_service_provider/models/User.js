import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true },

  password: { type: String }, // hashed

  role: {
    type: String,
    enum: ["customer", "provider", "admin"],
    required: true
  },

  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now }
});


export default mongoose.model("User", UserSchema);