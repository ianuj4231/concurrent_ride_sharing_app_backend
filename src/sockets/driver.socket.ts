import { Server, Socket } from "socket.io";
import { redisClient } from "../utils/redis.js";

export function registerDriverHandlers(io: Server, socket: Socket) {
  
  // Event triggered when a driver logs in / connects with their ID and initial location
  socket.on("driver:connect", async (data: { driverId: number; lat: number; lon: number }) => {
    try {
      console.log(`📥 [SOCKET RECEIVE] 'driver:connect' event triggered for Driver ID: ${data?.driverId}`, data);

      const { driverId, lat, lon } = data;

      if (!driverId || lat === undefined || lon === undefined) {
        console.warn(`⚠️ [VALIDATION FAILED] Missing fields in 'driver:connect':`, data);
        socket.emit("error", { message: "driverId, lat, and lon are required" });
        return;
      }

      // 1. Store socket mapping in Redis (k, v: driverid -> socketid)
      const socketKey = `driver:socket:${driverId}`;
      await redisClient.set(socketKey, socket.id);
      console.log(`💾 [REDIS SET] Saved mapping -> Key: '${socketKey}' => Value (Socket ID): '${socket.id}'`);

      // 2. Add driver location to Redis Geospatial index ('drivers')
      await redisClient.geoAdd("drivers", {
        longitude: lon.toString(),
        latitude: lat.toString(),
        member: driverId.toString(),
      });
      console.log(`🗺️ [REDIS GEOADD] Added Driver ${driverId} to geospatial index 'drivers' at Coordinates -> Latitude: ${lat}, Longitude: ${lon}`);

      // 3. Store driverId on socket instance for disconnect cleanup
      socket.data.driverId = driverId;
      console.log(`🔗 [SOCKET ATTACH] Bound driverId ${driverId} to socket session ${socket.id}`);

      console.log(`✅ [SUCCESS] Driver ${driverId} fully connected and registered in Redis!\n`);
      socket.emit("driver:connected-success", { message: "Successfully registered in Redis geospatial & socket map" });
    } catch (error) {
      console.error(`❌ [ERROR] Failed processing 'driver:connect' for Driver:`, error);
      socket.emit("error", { message: "Internal server error during driver connection" });
    }
  });

  // Event triggered when a driver updates their live location while online
  socket.on("driver:update-location", async (data: { driverId: number; lat: number; lon: number }) => {
    try {
      const { driverId, lat, lon } = data;
      if (!driverId || lat === undefined || lon === undefined) {
        console.warn(`⚠️ [VALIDATION FAILED] Missing fields in 'driver:update-location':`, data);
        return;
      }

      // Update geospatial position in Redis
      await redisClient.geoAdd("drivers", {
        longitude: lon.toString(),
        latitude: lat.toString(),
        member: driverId.toString(),
      });

      console.log(`📍 [REDIS GEOUPDATE] Driver ${driverId} updated live location -> Lat: ${lat}, Lon: ${lon}`);
    } catch (error) {
      console.error(`❌ [ERROR] Failed updating location for Driver ${data?.driverId}:`, error);
    }
  });

  // Handle driver disconnection
  socket.on("disconnect", async () => {
    try {
      const driverId = socket.data.driverId;
      console.log(`🔌 [SOCKET DISCONNECT] Client disconnected from socket ID: ${socket.id} (Associated Driver ID: ${driverId || "None"})`);

      if (driverId) {
        // Remove from socket mapping box
        const socketKey = `driver:socket:${driverId}`;
        await redisClient.del(socketKey);
        console.log(`🗑️ [REDIS DEL] Deleted key '${socketKey}'`);

        // Remove from geospatial 'drivers' box entirely (marks them offline/disconnected)
        await redisClient.zRem("drivers", driverId.toString());
        console.log(`🗑️ [REDIS ZREM] Removed Driver ${driverId} from geospatial index 'drivers'`);

        console.log(`❌ [CLEANUP COMPLETE] Driver ${driverId} successfully marked offline and scrubbed from Redis.\n`);
      }
    } catch (error) {
      console.error(`❌ [ERROR] Failed during cleanup on disconnect for socket ${socket.id}:`, error);
    }
  });
}