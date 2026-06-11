import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";

export const cacheInterceptor = (ttlInSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // If Redis isn't connected, bypass gracefully to MongoDB
    if (!redisClient) return next();

    // Generate a unique cache key based on the full requested URL and query strings
    // Example: "cache:/api/listings?lng=77.2&lat=28.6&radius=50000"
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Cache Hit! Serve directly from RAM
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Cache Miss! Overwrite res.json temporarily to intercept the database output before it goes to client
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful 200 responses to avoid caching server errors
        if (res.statusCode === 200 && redisClient) {
          redisClient.setex(cacheKey, ttlInSeconds, JSON.stringify(body));
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error(
        "Cache middleware failure, bypassing directly to database:",
        error,
      );
      next();
    }
  };
};
