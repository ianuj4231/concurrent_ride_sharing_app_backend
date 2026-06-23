import express, { Request, Response, NextFunction } from "express";
import { prismax } from "../lib/prisma.js"; // Your working database adapter

const app = express();
const port = 3000;

// CRITICAL: This middleware lets Express parse JSON bodies sent in requests
app.use(express.json());

// POST Endpoint to create a user along with an optional initial post
app.post("/seed", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, postTitle, postContent } = req.body;

    // Validation check
    if (!email) {
       res.status(400).json({ error: "Email is required" });
       return;
    }

    // Modern Prisma relational creation
    const user = await prismax.user.create({
      data: {
        name: name || "Anonymous",
        email: email,
        // Only create a post if a title is provided in the request body
        ...(postTitle && {
          posts: {
            create: {
              title: postTitle,
              content: postContent || "",
              published: true,
            },
          },
        }),
      },
      include: {
        posts: true, // Returns the newly created post in the response payload
      },
    });

    res.status(201).json({
      success: true,
      message: "User and initial post created successfully!",
      data: user,
    });
  } catch (error) {
    // Passes any database unique-constraint errors (e.g. duplicate email) to Express handler
    next(error); 
  }
});

// Simple Express Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`🚀 Server spinning at http://localhost:${port}`);
});