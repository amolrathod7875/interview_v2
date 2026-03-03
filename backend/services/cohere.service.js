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
  const text = String(raw || "").trim();
  if (!text) {
    throw new Error("Cohere returned empty content");
  }

  const cleaned = text
    .replace(/\uFEFF/g, "")
    .replace(/```json\s*/gi, "```")
    .trim();

  const candidates = [];

  const fencedBlocks = [...cleaned.matchAll(/```([\s\S]*?)```/g)]
    .map((match) => (match?.[1] || "").trim())
    .filter(Boolean);

  candidates.push(cleaned);
  candidates.push(...fencedBlocks);

  const findBalancedJSON = (input) => {
    const startObject = input.indexOf("{");
    const startArray = input.indexOf("[");

    let start = -1;
    let opening = "";
    let closing = "";

    if (startObject === -1 && startArray === -1) return null;

    if (startObject === -1 || (startArray !== -1 && startArray < startObject)) {
      start = startArray;
      opening = "[";
      closing = "]";
    } else {
      start = startObject;
      opening = "{";
      closing = "}";
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < input.length; index += 1) {
      const char = input[index];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === "\\") {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === opening) {
        depth += 1;
      } else if (char === closing) {
        depth -= 1;
        if (depth === 0) {
          return input.slice(start, index + 1).trim();
        }
      }
    }

    return null;
  };

  const balanced = findBalancedJSON(cleaned);
  if (balanced) {
    candidates.push(balanced);
  }

  let lastError = null;

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      return JSON.parse(candidate);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to parse Cohere JSON: ${lastError?.message || "Invalid JSON response"}`);
};
