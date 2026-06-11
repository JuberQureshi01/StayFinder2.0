import multer from "multer";

// Use MemoryStorage so files are kept in RAM as Buffers, NOT saved to disk.
// This is critical for deployment on Vercel, Render, or AWS Lambda.
const storage = multer.memoryStorage();

// Limit to 5MB per file to prevent memory exhaustion
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});
