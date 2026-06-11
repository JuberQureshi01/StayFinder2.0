import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  static async uploadImageBuffer(
    fileBuffer: Buffer,
    folderName: string = "stayfinder",
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folderName, format: "webp", quality: "auto" }, // Auto-compress for web performance
        (error, result) => {
          if (error) return reject(error);
          if (result?.secure_url) return resolve(result.secure_url);
          reject(new Error("Cloudinary upload returned no result"));
        },
      );

      // Pipe the buffer into the stream
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
}
