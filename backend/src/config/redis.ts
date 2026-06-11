import Redis from "ioredis";

let redisClient: Redis | null = null;

export const connectRedis = () => {
  if (!process.env.REDIS_URL) {
    console.warn(
      "⚠️ REDIS_URL not found in .env. System running without caching shield.",
    );
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });

    redisClient.on("connect", () =>
      console.log("🚀 Redis Cache Shield Active (Connected to RAM Store)"),
    );
    redisClient.on("error", (err) =>
      console.error("❌ Redis Connection Error:", err.message),
    );

    return redisClient;
  } catch (error) {
    console.error("Redis Initialization Failed:", error);
    return null;
  }
};

export { redisClient };
