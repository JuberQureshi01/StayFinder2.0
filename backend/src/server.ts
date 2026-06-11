import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import dotenv from "dotenv";
import cron from "node-cron";
import mongoose from "mongoose";
import Booking from "./modules/booking/booking.model";

dotenv.config();
// Configurations & Services
import connectDB from "./config/db";
import { connectRedis } from "./config/redis";
import { SocketService } from "./services/socket.service";

// Router Imports
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import listingRoutes from "./modules/listing/listing.routes";
import bookingRoutes from "./modules/booking/booking.routes";
import reviewRoutes from "./modules/review/review.routes";
import { handleRazorpayWebhook } from "./modules/payment/payment.webhook";
import paymentRoutes from "./modules/payment/payment.route";
import notificationRoutes from "./modules/notification/notification.routes";
import adminRoutes from "./modules/admin/admin.routes";
import hostApplicationRoutes from "./modules/host-application/host-application.routes";
import itineraryRoutes from "./modules/itinerary/itinerary.routes";
import refundRoutes from "./modules/refund/refund.routes";
import recommendationRoutes from "./modules/recommendation/recommendation.routes";

// =====================================================
// ENV VALIDATION — crash early if critical vars missing
// =====================================================
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ CRITICAL: Missing required environment variables: ${missing.join(", ")}`);
  console.error("Please set these in your .env file before starting the server.");
  process.exit(1);
}

// =====================================================
// PROCESS-LEVEL GUARDIANS (MUST be BEFORE app.listen)
// Catches everything that escapes Express middleware
// =====================================================
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("⚠️ CRITICAL UNHANDLED REJECTION AT:", promise, "REASON:", reason?.message || reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("💀 CRITICAL UNCAUGHT EXCEPTION:", error.message, error.stack);
  // Log and keep the process alive — do NOT process.exit in production
  // The server continues accepting requests; only the faulty request dies
});

// =====================================================
// BOOT
// =====================================================
const app = express();
const server = http.createServer(app);

// Async connection with retry — never blocks boot
const initConnections = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection failed on boot, will retry on next request:", err);
  }
  try {
    connectRedis();
  } catch (err) {
    console.error("Redis connection failed on boot, cache disabled:", err);
  }
};
initConnections();

// Initialize Real-Time WebSocket Server
SocketService.initialize(server);

// 3. Global Cross-Origin Resource Sharing Rules
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: !allowedOrigins.includes("*"),
  }),
);

// 4. THE STRIPE MIDDLEWARE TRAP (CRITICAL ORDER OF EXECUTION)
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook,
);

// 5. Global Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6. Enterprise Security Layer: Distributed Rate Limiting Shield
const apiSecurityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests detected from this connection. Shield active. Retry in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiSecurityLimiter);

// Stricter limits on sensitive routes
app.use("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use("/api/payments/verify", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many payment verification attempts." },
  standardHeaders: true,
  legacyHeaders: false,
}));

// 7. Core Application Endpoint Routes Matrix
app.use("/api/payments", paymentRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/host-application", hostApplicationRoutes);
app.use("/api/itineraries", itineraryRoutes);
app.use("/api/recommendations", recommendationRoutes);

// 8. Health Check Endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// 9. 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: `Resource endpoint [${req.method}] ${req.originalUrl} not found.`,
  });
});

// =====================================================
// CRON: Auto-complete bookings every midnight
// =====================================================
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running auto-complete booking task...");
    const today = new Date();
    const result = await Booking.updateMany(
      { status: "confirmed", checkOut: { $lte: today } },
      { status: "completed" },
    );
    if (result.modifiedCount > 0) {
      console.log(`Auto-completed ${result.modifiedCount} booking(s)`);
    }
  } catch (error) {
    console.error("Cron auto-complete error:", error);
  }
});

// =====================================================
// 10. GLOBAL ERROR HANDLER
// =====================================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle Multer errors specifically
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: "File too large. Maximum size is 5MB.",
      LIMIT_FILE_COUNT: "Too many files.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
    };
    return res.status(400).json({ message: messages[err.code] || err.message });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred."
      : err.message || "An unexpected internal server error occurred.";

  console.error(`💥 [${statusCode}] ${err.message || "Unknown error"}`);
  if (statusCode === 500) {
    console.error(err.stack || "No stack trace");
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// =====================================================
// 11. START SERVER
// =====================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` 🚀 STAY FINDER 2.0 API RUNNING ON PORT: ${PORT}      `);
  console.log(` 🛡️  RATE LIMITER: 100 req/15min per IP                `);
  console.log(` 🏭 MODE: ${process.env.NODE_ENV || "production"}  `);
  console.log(`===================================================`);
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log("MongoDB connection closed.");
    });
    const { redisClient } = require("./config/redis");
    if (redisClient) {
      redisClient.quit();
      console.log("Redis connection closed.");
    }
    process.exit(0);
  });
  // Force exit if graceful shutdown takes too long
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
