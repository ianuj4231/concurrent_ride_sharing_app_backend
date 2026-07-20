import { createClient, RedisClientType } from "redis";

class RedisService {
  private static instance: RedisService;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client.on("error", (err) => console.error("❌ Redis Client Error", err));
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("🚀 Connected to Redis successfully (Singleton)");
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}

// Export the singleton instance getter / direct client exporter
export const redisService = RedisService.getInstance();
export const redisClient = redisService.getClient();