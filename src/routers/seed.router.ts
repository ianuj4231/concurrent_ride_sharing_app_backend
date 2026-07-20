import { Router, Request, Response, NextFunction } from "express";
import { prismax } from "../../lib/prisma";

const router = Router();

router.post("/user", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ success: false, error: "Email and role (PASSENGER or DRIVER) are required" });
      return;
    }

    const user = await prismax.user.create({
      data: {
        name: name || "Anonymous",
        email,
        role: role.toUpperCase(), // PASSENGER or DRIVER
      },
    });

    res.status(201).json({
      success: true,
      message: `User created successfully as ${role.toUpperCase()}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export const seedRouter = router;