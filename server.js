const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const business = {
  sales: 124500,
  orders: 248,
  returns: 12,
  products: [
    { name: "Wireless Earbuds", sales: 42000 },
    { name: "Smart Watch", sales: 35500 },
    { name: "Phone Stand", sales: 18000 }
  ]
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "VocaBiz",
    message: "Business assistant backend is running."
  });
});

// Ask VocaBiz
app.post("/api/ask", async (req, res) => {
  const question = String(req.body.question || "").trim();

  console.log("QUESTION RECEIVED:", question);

  if (!question) {
    return res.status(400).json({
      error: "Please enter a question."
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Gemini API key is missing from .env"
    });
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    let response;
    let lastError;

    // Retry temporary API errors up to 3 attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",

          contents: `
DEMO BUSINESS DATA:
${JSON.stringify(business, null, 2)}

IMPORTANT DATA LIMITATIONS:
- This is sample data, not live Amazon data.
- Total sales: ₹124,500.
- Total orders: 248.
- Total returns: 12.
- Listed product sales total ₹95,500, not ₹124,500.
- Costs, expenses, and actual profit are not provided.
- Do not invent missing figures.

SELLER QUESTION:
${question}
`,

          config: {
            systemInstruction: `
You are VocaBiz, a multilingual AI business assistant.

LANGUAGE:
1. Understand questions written in any language.
2. Reply in the same language as the user's question.
3. Support Hindi, English, Hinglish, and other languages.
4. Match the user's language naturally.

BUSINESS RULES:
1. Give simple, friendly, practical answers.
2. Use the supplied demo data accurately.
3. Never claim to access live Amazon Seller Central data.
4. Never invent sales, orders, expenses, costs, or profits.
5. Explain that profit cannot be calculated without costs and expenses.
6. Clearly label forecasts as estimates.
7. Explain when there is insufficient data for a reliable forecast.
8. Use Indian rupees (₹) for monetary values.
9. Keep answers concise and easy to understand.
`
          }
        });

        break;

      } catch (error) {
        lastError = error;

        const message = String(error.message || "");

        const retryable =
          message.includes("503") ||
          message.includes("429") ||
          message.includes("500") ||
          message.includes("UNAVAILABLE") ||
          message.toLowerCase().includes("overloaded");

        console.error(
          `Gemini attempt ${attempt} failed:`,
          message
        );

        if (!retryable || attempt === 3) {
          throw error;
        }

        // Wait 2 seconds, then 4 seconds before retrying
        await new Promise(resolve =>
          setTimeout(resolve, attempt * 2000)
        );
      }
    }

    if (!response) {
      throw lastError || new Error("Gemini request failed.");
    }

    res.json({
      answer: response.text || "Please try asking another question."
    });

  } catch (error) {
    console.error("Gemini API error:", error.message);

    res.status(500).json({
      error: error.message || "Unknown Gemini API error"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`VocaBiz backend running on http://localhost:${PORT}`);
});