import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinaryConfig.js";

const router = express.Router();
const upload = multer({ storage });

// POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  console.log("REQ.FILE:", req.file);

  if (!req.file) {
    console.error("❌ No file uploaded or wrong form key name");
    return res.status(400).json({ message: "No file provided" });
  }

  res.json({ imageUrl: req.file.path });
});

export default router;
