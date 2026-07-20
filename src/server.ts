import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { redisClient, redisService } from "./utils/redis.js";
import { seedRouter } from "./routers/seed.router.js";
import { registerDriverHandlers } from "./sockets/driver.socket.js";
import { bookingRouter } from "./routers/booking.router.js";

const app = express();
const port = 3000;

// CRITICAL: Middleware to parse JSON bodies in requests
app.use(express.json());

// Create HTTP server from Express app to attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);


// Basic health check route
app.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Pong! Backend is running." });
});

// Seed Router
app.use("/api/seed", seedRouter);
app.use("/api/booking", bookingRouter);

// Socket.io Connection Listener
io.on("connection", (socket: Socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Register driver-specific real-time events
  registerDriverHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Simple Express Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

async function clearStaleRedisData() {
  try {
    console.log("🧹 [SERVER BOOT] Beginning Redis state cleanup...");

    // 1. Wipe the geospatial index
    const geoDeleted = await redisClient.del("drivers");
    console.log(`🗺️ [REDIS CLEANUP] Geospatial 'drivers' index deletion result: ${geoDeleted ? "Deleted successfully" : "Key not found / already empty"}`);

    // 2. Wipe all stale individual socket mapping keys
    const socketKeys = await redisClient.keys("driver:socket:*");
    if (socketKeys.length > 0) {
      console.log(`🔌 [REDIS CLEANUP] Found ${socketKeys.length} stale driver socket key(s):`, socketKeys);
      const socketsDeleted = await redisClient.del(socketKeys);
      console.log(`🗑️ [REDIS CLEANUP] Successfully deleted ${socketsDeleted} socket mapping key(s).`);
    } else {
      console.log("🔌 [REDIS CLEANUP] No stale driver socket keys found.");
    }

    // 3. Wipe old driver locks
    const lockKeys = await redisClient.keys("driver:lock:*");
    if (lockKeys.length > 0) {
      console.log(`🔒 [REDIS CLEANUP] Found ${lockKeys.length} stale driver lock key(s):`, lockKeys);
      const locksDeleted = await redisClient.del(lockKeys);
      console.log(`🗑️ [REDIS CLEANUP] Successfully deleted ${locksDeleted} driver lock key(s).`);
    } else {
      console.log("🔒 [REDIS CLEANUP] No stale driver lock keys found.");
    }

    console.log("✨ [SERVER BOOT] Redis state cleanup completed successfully. System is fresh.\n");
  } catch (err) {
    console.error("❌ [REDIS CLEANUP ERROR] Failed to clear Redis on startup:", err);
  }
}
// Start Server and Connect Redis Singleton
server.listen(port, async () => {
  try {
    await redisService.connect();
    await clearStaleRedisData();
    console.log(`🚀 Server spinning at http://localhost:${port}`);
  } catch (error) {
    console.error("❌ Failed to start server due to Redis connection error:", error);
  }
});

export { io };