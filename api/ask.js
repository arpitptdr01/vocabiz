
const { GoogleGenAI } = require("@google/genai");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const question = String(req.body?.question || "").trim();

  if (!question) {
    return res.status(400).json({ error: "Please enter a question." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key is missing." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: question,
      config: {
        systemInstruction:
          "You are VocaBiz, a helpful business assistant for Amazon sellers. Give clear, practical answers. Never invent sales figures or claim to access live Amazon seller data unless that data has actually been provided.",
      },
    });

    return res.status(200).json({
      answer: response.text || "Please try asking in a different way.",
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({
      error: error.message || "Gemini API request failed.",
    });
  }
}
