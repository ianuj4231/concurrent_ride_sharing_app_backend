import { Request, Response } from "express";
// import { handleDriverRejection } from "../services/booking.service";
import { handleDriverRejection, handleDriverAcceptance } from "../services/booking.service";


export const rejectBookingController = async (req: Request, res: Response) => {
  try {
    const { driverId, bookingId } = req.body;

    // Validate payload
    if (!driverId || !bookingId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: driverId and bookingId are required.",
      });
    }

    // Call service to handle core rejection logic
    const io = req.app.get("io");
    await handleDriverRejection(driverId, bookingId, io);

    return res.status(200).json({
      success: true,
      message: "Ride request rejected successfully. Driver is now available.",
    });
  } catch (error: any) {
    console.error("❌ Error in rejectBookingController:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during ride rejection.",
    });
  }
};



export const acceptBookingController = async (req: Request, res: Response) => {
  try {
    const { driverId, bookingId } = req.body;

    if (!driverId || !bookingId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: driverId and bookingId are required.",
      });
    }

    const io = req.app.get("io");
    const result = await handleDriverAcceptance(driverId, bookingId, io);

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.message, // e.g., "Ride already taken"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride accepted successfully!",
      data: result.booking,
    });
  } catch (error: any) {
    console.error("❌ Error in acceptBookingController:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during ride acceptance.",
    });
  }
};