import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { sanitizeInput } from "./middleware/sanitize.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);

// Required for secure cookies behind Render's reverse proxy
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://household-service-provider.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Socket.IO Server (reusing the same CORS allowlist)
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(sanitizeInput);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "online", message: "SmartService API Gateway is active" });
});

// API Route Mounts
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

// Socket.IO Live Tracking (with payload validation)
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-booking", (bookingId) => {
    if (!bookingId || typeof bookingId !== "string") return;
    socket.join(bookingId);
  });

  socket.on("provider-location-update", (data) => {
    if (
      !data?.bookingId ||
      typeof data.lat !== "number" ||
      typeof data.lng !== "number"
    ) {
      return;
    }
    io.to(data.bookingId).emit("location-updated", {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date(),
    });
  });

  socket.on("provider-stopped-tracking", (data) => {
    if (!data?.bookingId) return;
    io.to(data.bookingId).emit("tracking-stopped");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// 404 Fallback for unmatched endpoints
app.use((req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("Global Server Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// Server Init (must use httpServer, not app.listen)
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT}`);
});