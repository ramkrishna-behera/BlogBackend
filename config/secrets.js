import dotenv from "dotenv";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

/**
 * Loads secrets either from .env (local) or Secret Manager (production)
 */
export async function loadSecrets() {
  if (process.env.NODE_ENV !== "production") {
    // Local dev → load from .env
    dotenv.config();
    console.log("⚡ Using .env variables (local dev), skipping Secret Manager");
    return;
  }

  // Production → fetch from Secret Manager
  const client = new SecretManagerServiceClient();

  async function accessSecret(name) {
    const [version] = await client.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${name}/versions/latest`,
    });
    return version.payload.data.toString();
  }

  process.env.JWT_SECRET = await accessSecret("JWT_SECRET");
  process.env.MONGO_URI = await accessSecret("MONGO_URI");

  process.env.CLOUDINARY_CLOUD_NAME = await accessSecret("CLOUDINARY_CLOUD_NAME");
  process.env.CLOUDINARY_API_KEY = await accessSecret("CLOUDINARY_API_KEY");
  process.env.CLOUDINARY_API_SECRET = await accessSecret("CLOUDINARY_API_SECRET");

  process.env.OPENAI_API_KEY = await accessSecret("OPENAI_API_KEY");

  process.env.HF_API_KEY = await accessSecret("HF_API_KEY");
  process.env.HF_API_URL = await accessSecret("HF_API_URL");

  process.env.SMTP_HOST = await accessSecret("SMTP_HOST");
  process.env.SMTP_PORT = await accessSecret("SMTP_PORT");
  process.env.SMTP_SECURE = await accessSecret("SMTP_SECURE");
  process.env.SMTP_USER = await accessSecret("SMTP_USER");
  process.env.SMTP_PASS = await accessSecret("SMTP_PASS");
  process.env.MAIL_FROM = await accessSecret("MAIL_FROM");

  process.env.PORT = await accessSecret("PORT");

  console.log("✅ Secrets loaded successfully from Secret Manager (production)");
}