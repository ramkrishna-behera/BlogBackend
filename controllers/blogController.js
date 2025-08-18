// controllers/blogController.js
import Blog from "../models/Blog.js";

// Create a blog
export const createBlog = async (req, res) => {
  try {
    const { title, content, category, image } = req.body;

    // Always take author from logged-in user (_id from token)
    const blog = new Blog({
      title,
      content,
      category,
      image,
      author: req.user._id, // FIX: use _id consistently
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all blogs (optional category filter)
export const getBlogs = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const blogs = await Blog.find(filter)
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single blog + increment view count
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update blog (only if author is same)
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // FIX: null check before .toString()
    if (!blog.author || blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this blog" });
    }

    const { title, content, category, image } = req.body;
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.image = image || blog.image;

    const updated = await blog.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete blog (only if author is same)
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // FIX: null check before .toString()
    if (!blog.author || blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this blog" });
    }

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like or Unlike blog
export const toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (!blog.likedBy) {
      blog.likedBy = [];
    }

    const alreadyLiked = blog.likedBy.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      blog.likedBy = blog.likedBy.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      blog.likedBy.push(req.user._id);
    }

    blog.likes = blog.likedBy.length;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
