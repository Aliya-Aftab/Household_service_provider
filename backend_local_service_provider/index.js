import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import { Server } from "socket.io";
import { createServer } from "http";

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
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Socket.IO Logic
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // A user joins a specific booking room to track/share location
  socket.on("join-booking", (bookingId) => {
    socket.join(bookingId);
    console.log(`Socket ${socket.id} joined booking ${bookingId}`);
  });

  // Provider sends their live location
  socket.on("provider-location-update", (data) => {
    // data should contain { bookingId, lat, lng }
    // Forward the location to everyone in the booking room (the customer)
    io.to(data.bookingId).emit("location-updated", {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date()
    });
  });

  // Provider stops sharing location
  socket.on("provider-stopped-tracking", (data) => {
    io.to(data.bookingId).emit("tracking-stopped");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});