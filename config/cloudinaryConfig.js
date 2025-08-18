import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary ENV:", {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING"
});


const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog_images", // optional folder in your Cloudinary account
    allowed_formats: [
      "jpg",
      "png",
      "jpeg",
      "gif",
      "bmp",
      "webp",
      "svg",
      "tiff",
    ],
  },
});

export { cloudinary, storage };
