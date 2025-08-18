import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn("⚠ OPENAI_API_KEY is missing. AI routes will be disabled.");
}

// Simple guard
const required = (v, name) => {
  if (!v || !String(v).trim()) throw new Error(`${name} is required`);
};

router.get("/stream-blog", async (req, res) => {
  try {
    const { title, category, tone, wordCount } = req.query || {};
    required(title, "Title");

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const userPrompt = [
      `Write a complete blog post based on the following:`,
      `Title: ${title}`,
      category ? `Category: ${category}` : null,
      `Tone: ${tone || "friendly, clear, and authoritative"}`,
      `Target length: ${wordCount || "900–1200 words"}`,
      "",
      "Requirements:",
      "- Output **Markdown** only (no HTML).",
      "- Start with a one-line SEO meta description prefixed with `Meta:` (<=155 chars).",
      "- Use H2/H3 headings, short paragraphs, and bullet lists where helpful.",
      "- Add an engaging intro and a succinct conclusion with a call-to-action.",
      "- Weave in relevant subtopics, examples, and practical tips.",
      "- Avoid placeholders or fake stats.",
    ]
      .filter(Boolean)
      .join("\n");

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert blog writer. Produce polished, factual, Markdown-formatted articles ready to publish.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      if (token) {
        res.write(`data: ${JSON.stringify(token)}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("AI stream-blog error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// --- Route: AI Cover Image ---
router.post("/generate-image", async (req, res) => {
  try {
    if (!process.env.HF_API_KEY) throw new Error("Hugging Face API key is missing");

    const { prompt } = req.body;
    required(prompt, "Prompt");

    const response = await fetch(process.env.HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Hugging Face API error: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
