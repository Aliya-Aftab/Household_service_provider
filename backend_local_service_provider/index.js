import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*", // Allows requests from Vercel frontend or localhost
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "online", message: "SmartService API Gateway is active" });
});

// API Route Mounts (Strictly mapped to frontend endpoints)
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);

// 404 Fallback for unmatched endpoints
app.use((req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Centralized Error Handler (Always returns clean JSON)
app.use((err, req, res, next) => {
  console.error("Global Server Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// Server Init
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT}`);
});