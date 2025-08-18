import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleLike
} from "../controllers/blogController.js";
import { protect } from "../middleware/authMiddleware.js"; // assuming JWT auth

const router = express.Router();

router.post("/", protect, createBlog);
router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.put("/:id", protect, updateBlog);
router.delete("/:id", protect, deleteBlog);
router.post("/:id/like", protect, toggleLike);

export default router;
