import { z } from "zod";

// --- AUTHENTICATION MODULE SCHEMAS ---
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name cannot exceed 50 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email format specified")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password cannot exceed 100 characters"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format specified")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

// --- LISTING MODULE SCHEMAS ---
export const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z
    .string()
    .min(20, "Description must be descriptive (min 20 chars)"),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Price must be greater than zero"),
  ),
  amenities: z.preprocess(
    (val) => {
      if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
      if (Array.isArray(val)) return val;
      return [];
    },
    z.array(z.string()).min(1, "Select at least one amenity"),
  ),
  location: z.string().min(1, "Location string is mandatory"),
  category: z.string().optional(),
  locationName: z.string().min(1, "Location name is required"),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  maxGuests: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1, "Must allow at least 1 guest").optional(),
  ),
  cleaningFee: z.preprocess(
    (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
    z.number().min(0, "Cleaning fee cannot be negative").optional(),
  ),
});




//booking validation schemas

export const createBookingSchema = z.object({
  listingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId string configuration format"),
  checkIn: z
    .string()
    .datetime({ message: "Invalid ISO 8601 Check-In date string configuration" })
    .or(z.string().date("Invalid date configuration structure format")),
  checkOut: z
    .string()
    .datetime({ message: "Invalid ISO 8601 Check-Out date string configuration" })
    .or(z.string().date("Invalid date configuration structure format")),
}).refine((data) => {
  const start = new Date(data.checkIn).getTime();
  const end = new Date(data.checkOut).getTime();
  return end > start;
}, {
  message: "Check-out date schedule timeline execution must fall after your check-in date criteria",
  path: ["checkOut"],
});

export const bookingParamSchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId trace format"),
});

export const searchQueriesSchema = z.object({
  lng: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  lat: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  radius: z.string().optional().default("50000").transform((v) => Number(v)),
  minPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  amenities: z.string().optional(),
  page: z.string().optional().default("1").transform((v) => Number(v)),
  pageSize: z.string().optional().default("10").transform((v) => Number(v)),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid database resource target format type"),
});

export const initializePaymentSchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId payment registration reference"),
});

export const createReviewSchema = z.object({
  rating: z
    .preprocess((val) => Number(val), z.number().min(1, "Minimum rating is 1 star").max(5, "Maximum rating is 5 stars")),
  comment: z
    .string()
    .min(10, "Your comment must be at least 10 characters long to ensure quality feedback")
    .max(1000, "Your comment cannot exceed 1000 characters"),
});

export const updateReviewSchema = createReviewSchema.partial(); // Allows updating just the rating or just the comment

export const reviewParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Review ID format mapping"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
});

export const listingIdParamSchema = z.object({
  listingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid listing reference identifier mapping"),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid booking reference identifier mapping"),
});

export const similarListingSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid listing reference identifier mapping"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  role: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500, "Reason cannot exceed 500 characters").optional(),
});

export const blockDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format"),
});

export const cancelBookingBodySchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format"),
});