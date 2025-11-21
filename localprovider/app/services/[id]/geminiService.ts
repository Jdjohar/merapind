// services/geminiService.ts
// Server-only helpers for calling Gemini. DO NOT import from client code.

import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in environment");
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Analyze free-form user problem text and return structured JSON:
 * { category, reason, suggestedPros }
 */
export async function callGeminiAnalyze(userQuery: string) {
  const ai = getClient();
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: `The user has a home maintenance problem: "${userQuery}". 
Identify the best service category (e.g., Plumber, Electrician, Carpenter, Cleaner, Painter, HVAC, Landscaper). 
Return a JSON object with keys: category, reason (short), suggestedPros (array of 3 generic professional titles).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          reason: { type: Type.STRING },
          suggestedPros: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["category", "reason", "suggestedPros"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    return { category: "General", reason: "No analysis returned", suggestedPros: [] };
  }

  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    // If parsing fails, return fallback
    return { category: "General", reason: "Could not parse AI response", suggestedPros: [] };
  }
}

/**
 * Generate a short chat reply from conversation history + last message.
 * Returns a string reply.
 */
export async function callGeminiChat(history: string[], lastMessage: string) {
  const ai = getClient();
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: `You are a helpful assistant for a home services app.
Conversation history:
${history.join("\n")}

User just said: "${lastMessage}"

Produce a short (<=2 sentences), polite, professional reply appropriate for an automated system or placeholder.`,
  });

  return response.text || "I've received your message and will get back to you shortly.";
}
