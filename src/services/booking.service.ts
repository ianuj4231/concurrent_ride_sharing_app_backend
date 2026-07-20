import { prismax } from "../../lib/prisma.js";
import { redisClient } from "../utils/redis.js";
import { Server as SocketIOServer } from "socket.io";

export const handleDriverRejection = async (
  driverId: string | number,
  bookingId: string | number,
  io: SocketIOServer
) => {
  console.log(`\n❌ [DRIVER REJECT] Driver ${driverId} rejected booking ${bookingId}`);

  const lockKey = `driver:lock:${driverId}`;
  const socketKey = `driver:socket:${driverId}`;

  // Step 1: Verify and release the driver's Redis lock
  const lockedBooking = await redisClient.get(lockKey);
  
  // Only remove lock if it matches this booking (prevent clearing a newer lock by mistake)
  if (lockedBooking === `booking:${bookingId}`) {
    await redisClient.del(lockKey);
    console.log(`🔓 [REDIS] Released lock for driver ${driverId}`);
  }

  // Step 2: Retrieve the driver's active socket ID from Redis
  const socketId = await redisClient.get(socketKey);

  // Step 3: Emit socket event to make the popup disappear on their UI
  if (io && socketId) {
    io.to(socketId).emit("ride:rejected", { bookingId });
    console.log(`📡 [SOCKET] Sent 'ride:rejected' signal to driver socket: ${socketId}`);
  } else {
    console.log(`⚠️ [SOCKET] Driver ${driverId} is offline or socket mapping not found.`);
  }
};

export const handleDriverAcceptance = async (
  driverId: string | number,
  bookingId: string | number,
  io: SocketIOServer
) => {
  console.log(`\n✅ [DRIVER ACCEPT] Driver ${driverId} attempting to accept booking ${bookingId}`);

  const bookingLockKey = `booking:lock:${bookingId}`;

  // ==========================================
  // STEP 1: Attempt Atomic Redis Lock for the Booking
  // ==========================================
  const acquired = await redisClient.set(bookingLockKey, driverId, {
    NX: true,
    EX: 10,
  });

  if (!acquired) {
    console.log(`❌ [RACE LOST] Driver ${driverId} was too late. Booking ${bookingId} is already locked/taken.`);
    return { success: false, message: "Too late! This ride has already been accepted by another driver." };
  }

  try {
    // ==========================================
    // STEP 2: Check & Update MySQL Database
    // ==========================================
    const booking = await prismax.booking.findUnique({
      where: { id: Number(bookingId) },
    });

    if (!booking || booking.status !== "PENDING") {
      return { success: false, message: "This booking is no longer available or has expired." };
    }

    // Atomically claim the booking in MySQL using CONFIRMED status
    const updatedBooking = await prismax.booking.update({
      where: { id: Number(bookingId) },
      data: {
        status: "CONFIRMED",
        driverId: Number(driverId),
      },
    });

    console.log(`💾 [MySQL] Booking ${bookingId} successfully updated to CONFIRMED for Driver ${driverId}`);

    // ==========================================
    // STEP 3: Cleanup & Broadcast via WebSockets
    // ==========================================
    // 1. Clear this winning driver's individual busy lock so they stay locked to this ride
    await redisClient.set(`driver:lock:${driverId}`, `booking:${bookingId}`);

    // 2. Broadcast a global signal to all other drivers' popups to disappear
    if (io) {
      io.emit("ride:assigned", { bookingId });
      console.log(`📡 [SOCKET] Broadcasted 'ride:assigned' for booking ${bookingId}`);
    }

    return { success: true, booking: updatedBooking };

  } catch (error) {
    console.error("❌ Error processing acceptance transaction:", error);
    throw error;
  } finally {
    // ==========================================
    // STEP 4: Release the Atomic Booking Lock
    // ==========================================
    await redisClient.del(bookingLockKey);
  }
};