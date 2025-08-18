import express from "express";
import { addComment, getCommentsByBlog, deleteComment } from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to add a comment to a blog post (Protected - requires auth)
router.post("/:blogId", protect, addComment);

// Route to get all comments for a specific blog post (Public)
router.get("/:blogId", getCommentsByBlog);

// Route to delete a comment by its ID (Protected - requires auth)
router.delete("/:commentId", protect, deleteComment);

export default router;
