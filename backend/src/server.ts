import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import connectDB from "./config/db";
import { connectRedis, redisClient } from "./config/redis";
import { SocketService } from "./services/socket.service";
import { globalErrorHandler } from "./middlewares/error.middleware";

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


// PROCESS-LEVEL GUARDIANS
process.on("unhandledRejection", (reason: any) => {
  // this is for unhandled promise rejections, which can happen if an async function throws an error and it's not caught. It's important to log these so we can fix them.
  console.error("UNHANDLED REJECTION:", reason?.message || reason);
});

process.on("uncaughtException", (error: Error) => {
  //this is for uncaught exceptions, which can happen if a synchronous function throws an error and it's not caught. Again, logging is crucial for debugging.
  console.error("UNCAUGHT EXCEPTION:", error.message, error.stack);
});


// BOOT
const app = express();
const server = http.createServer(app);

const initConnections = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection failed:", err);
  }
  try {
    connectRedis();
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
};

initConnections();
SocketService.initialize(server);


// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o: string) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: !allowedOrigins.includes("*"),
  }),
);


// Webhook (must be before body parsers)
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook,
);


// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// Rate limiting
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests. Try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);


app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts." },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);


app.use(
  "/api/payments/verify",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many payment verification attempts." },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);


// Routes
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


// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});


// 404 handler
app.use((req: Request, res: Response) => {
  res
    .status(404)
    .json({ message: `Route [${req.method}] ${req.originalUrl} not found.` });
});


// Global error handler
app.use(globalErrorHandler);


// START
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// GRACEFUL SHUTDOWN
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => console.log("MongoDB closed."));
    if (redisClient) {
      redisClient.quit();
      console.log("Redis closed.");
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM")); //when the server is terminated by the host (e.g., Heroku, AWS)
process.on("SIGINT", () => shutdown("SIGINT")); //when developer shuts down the app using ctrl+c
