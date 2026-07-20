import { Router, Request, Response } from "express";
import { redisClient } from "../utils/redis.js";
import { prismax } from "../../lib/prisma";
// import { rejectBookingController } from "../controllers/booking.controller.js";
import { rejectBookingController, acceptBookingController } from "../controllers/booking.controller";


const router = Router();

// Passenger booking endpoint
router.post("/book", async (req: Request, res: Response) => {
  try {
    const { passengerId, sourceLat, sourceLon, destLat, destLon, radiusKm = 5 } = req.body;

    if (!passengerId || sourceLat === undefined || sourceLon === undefined || destLat === undefined || destLon === undefined) {
      return res.status(400).json({
        success: false,
        error: "passengerId, sourceLat, sourceLon, destLat, and destLon are required",
      });
    }

    console.log(`\n📥 [BOOKING REQUEST] Passenger [${passengerId}] wants a ride from (${sourceLat}, ${sourceLon}) to (${destLat}, ${destLon})`);

    // ==========================================
    // STEP 1: Save booking to MySQL with "PENDING" status via Prisma
    // ==========================================
    const newBooking = await prismax.booking.create({
      data: {
        passengerId: Number(passengerId),
        sourceLat: Number(sourceLat),
        sourceLon: Number(sourceLon),
        destLat: Number(destLat),
        destLon: Number(destLon),
        status: "PENDING",
      },
    });

    console.log(`💾 [DB SAVED] Created booking ID: ${newBooking.id} with status 'PENDING' in MySQL`);

    // ==========================================
    // STEP 2: Query Redis Geospatial Index for Drivers
    // ==========================================
    console.log(`🔍 [REDIS SEARCH] Searching for drivers within ${radiusKm}km of pickup location...`);
    const nearbyDrivers = await redisClient.geoSearchWith(
      "drivers",
      { longitude: Number(sourceLon), latitude: Number(sourceLat) },
      { radius: Number(radiusKm), unit: "km" },
      ["WITHCOORD", "WITHDIST"],
      { SORT: "ASC" }
    );

    console.log(`✅ [REDIS RESULT] Found ${nearbyDrivers.length} raw nearby drivers`);

    // ==========================================
    // STEP 3: DRIVER BUSY LOCK BOX (Concurrency Guard)
    // ==========================================
    const availableDrivers: typeof nearbyDrivers = [];

    for (const driver of nearbyDrivers) {
      const driverId = driver.member;
      const lockKey = `driver:lock:${driverId}`;

      const acquiredLock = await redisClient.set(lockKey, `booking:${newBooking.id}`, {
        NX: true,
        EX: 60,
      });

      if (acquiredLock) {
        console.log(`🔒 [LOCK ACQUIRED] Driver ${driverId} locked successfully for booking ${newBooking.id}`);
        availableDrivers.push(driver);
      } else {
        console.log(`⚠️ [LOCK SKIPPED] Driver ${driverId} is already busy/locked by another booking request.`);
      }
    }

    // ==========================================
    // STEP 4: NOTIFY AVAILABLE DRIVERS VIA SOCKET.IO
    // ==========================================
    const io = req.app.get("io"); // Grab the Socket.IO instance attached in server.ts

    if (io && availableDrivers.length > 0) {
      for (const driver of availableDrivers) {
        const driverId = driver.member;
        const socketKey = `driver:socket:${driverId}`;

        // Look up the active socket ID for this driver from Redis
        const socketId = await redisClient.get(socketKey);

        if (socketId) {
          io.to(socketId).emit("ride:request", {
            bookingId: newBooking.id,
            passengerId: Number(passengerId),
            pickup: { lat: sourceLat, lon: sourceLon },
            destination: { lat: destLat, lon: destLon },
            distanceKm: driver.distance,
          });
          console.log(`📡 [SOCKET EMIT] Sent ride request notification to Driver ${driverId} on socket ID: ${socketId}`);
        } else {
          console.log(`⚠️ [SOCKET NOT FOUND] Driver ${driverId} is locked, but no active socket mapping found in Redis.`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      booking: newBooking,
      message: `Booking created successfully as PENDING. Notified ${availableDrivers.length} available drivers.`,
      drivers: availableDrivers,
    });
  } catch (error) {
    console.error("❌ Error during booking process:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during booking",
    });
  }
});


router.post("/reject", rejectBookingController);


// POST /api/bookings/accept
router.post("/accept", acceptBookingController);

export { router as bookingRouter };