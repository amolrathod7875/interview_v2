/**
 * Cohere AI Service
 * Uses Cohere v2 Chat API (command-r7b-12-2024 — free tier)
 * API docs: https://docs.cohere.com/v2/reference/chat
 */

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_MODEL = "command-r7b-12-2024"; // Free-tier model
const COHERE_CHAT_URL = "https://api.cohere.com/v2/chat";

/**
 * Call Cohere Chat API
 * @param {string} userPrompt - The user message / task
 * @param {string} systemPrompt - Optional system/persona instruction
 * @param {number} maxTokens - Max tokens to generate (default 2048)
 * @returns {Promise<string>} Generated text content
 */
export const callCohere = async (
  userPrompt,
  systemPrompt = "You are a helpful AI assistant. Respond with valid JSON only when asked.",
  maxTokens = 2048,
  apiKey // optional override
) => {
  const key = apiKey || COHERE_API_KEY;
  if (!key) {
    throw new Error(" COHERE API key missing (provide COHERE_API_KEY or pass apiKey)");
  }

  console.log("[COHERE] Sending request | prompt length:", userPrompt.length);

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userPrompt });

  const response = await axios.post(
    COHERE_CHAT_URL,
    {
      model: COHERE_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.35,
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    }
  );

  // Cohere v2 response shape:
  // { message: { content: [{ type: "text", text: "..." }] } }
  const content = response.data?.message?.content;
  if (!content || !Array.isArray(content) || content.length === 0) {
    throw new Error("Empty response from Cohere");
  }

  const text = content.find((c) => c.type === "text")?.text;
  if (!text) {
    throw new Error("No text content in Cohere response");
  }

  console.log("[COHERE] Response received | length:", text.length);
  return text;
};

/**
 * Parse and clean JSON from Cohere response
 * Strips markdown fences, trims whitespace
 * @param {string} raw - Raw Cohere response text
 * @returns {any} Parsed JSON object
 */
export const parseCohereJSON = (raw) => {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  return JSON.parse(cleaned);
};
