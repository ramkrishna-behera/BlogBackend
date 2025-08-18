import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import cloudinaryRoutes from "./routes/cloudinaryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Increase payload limit for JSON bodies (default is 100kb)
app.use(express.json({ limit: "10mb" }));

// For URL encoded form data too:
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000", // React dev server
  "https://blog-frontend-coral-eta.vercel.app", // Your production frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/upload", cloudinaryRoutes); // Image upload route
app.use("/api/ai", aiRoutes); // AI routes

// Root route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server only after DB connection
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  });

console.log("JWT_SECRET from env:", process.env.JWT_SECRET);