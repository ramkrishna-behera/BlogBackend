import nodemailer from "nodemailer";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

function isEmail(str = "") {
  return /^\S+@\S+\.\S+$/.test(str);
}

// Create transporter once per process
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Optional pooling (nice if you’ll send bursts)
  // pool: true, maxConnections: 3, maxMessages: 100,
});

// Verify SMTP on boot (logs once; doesn’t crash the app)
let smtpReady = false;
(async () => {
  try {
    await transporter.verify();
    smtpReady = true;
    console.log("[newsletter] SMTP verified and ready ✅");
  } catch (e) {
    smtpReady = false;
    console.warn("[newsletter] SMTP verify failed (will keep trying to send):", e?.message || e);
  }
})();

async function sendWelcomeEmail(toEmail) {
  const from = process.env.MAIL_FROM || `"My Blog" <${process.env.SMTP_USER}>`;
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
      <h2>Welcome 👋</h2>
      <p>Thanks for subscribing to our newsletter!</p>
      <p>You’ll now receive updates with the latest articles 🚀</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
      <p style="color:#666;font-size:12px">If this wasn’t you, you can ignore this email.</p>
    </div>
  `;

  return transporter.sendMail({
    from,
    to: toEmail,
    subject: "Welcome to our Newsletter 🎉",
    html,
  });
}

export const health = async (req, res) => {
  return res.status(200).json({
    status: "ok",
    smtpReady,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
  });
};

export const subscribe = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || !isEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Atomic upsert avoids race condition and duplicate key noise
    const upsert = await NewsletterSubscriber.updateOne(
      { email: email.toLowerCase().trim() },
      { $setOnInsert: { email: email.toLowerCase().trim() } },
      { upsert: true }
    );

    const isNew = !!upsert.upsertedCount;

    // Try to send welcome email, but do not fail the subscription if it errors
    try {
      await sendWelcomeEmail(email);
    } catch (mailErr) {
      console.warn("[newsletter] welcome email send failed:", mailErr?.message || mailErr);
      // If you want to alert frontend to retry UI message:
      if (isNew) {
        return res.status(201).json({
          message:
            "Subscribed successfully 🎉 (Welcome email couldn’t be sent right now, but you’re on the list.)",
        });
      } else {
        return res.status(200).json({
          message: "Already subscribed 🎉 (Welcome email skipped)",
        });
      }
    }

    if (isNew) {
      return res.status(201).json({ message: "Subscribed successfully 🎉 Check your inbox!" });
    }
    return res.status(200).json({ message: "Already subscribed 🎉" });
  } catch (err) {
    // Duplicate key safeguard (unique index)
    if (err?.code === 11000) {
      return res.status(200).json({ message: "Already subscribed 🎉" });
    }
    console.error("Newsletter subscribe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
