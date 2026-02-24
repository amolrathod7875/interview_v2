/**
 * AssemblyAI Transcription Service
 * Converts audio files (webm, mp3, wav, etc.) → text using AssemblyAI STT
 * API docs: https://www.assemblyai.com/docs
 *
 * Flow:
 *  1. Upload audio binary  → returns upload_url
 *  2. Create transcript job → returns { id }
 *  3. Poll until status === "completed" or "error"
 */

import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.ASSEMBLY_AI_API_KEY;
const BASE_URL = "https://api.assemblyai.com/v2";
const HEADERS = { authorization: API_KEY, "content-type": "application/json" };
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const MAX_WAIT_MS = 120000; // 2 minute max wait

/**
 * Upload a local audio file to AssemblyAI CDN
 * @param {string} filePath - Absolute path to audio file on disk
 * @returns {Promise<string>} upload_url to use for transcription
 */
export const uploadAudioFile = async (filePath) => {
  if (!API_KEY) throw new Error(" ASSEMBLY_AI_API_KEY missing");

  const fileData = fs.readFileSync(filePath);
  const response = await axios.post(`${BASE_URL}/upload`, fileData, {
    headers: {
      authorization: API_KEY,
      "content-type": "application/octet-stream",
      "transfer-encoding": "chunked",
    },
    maxBodyLength: Infinity,
    timeout: 60000,
  });

  const uploadUrl = response.data?.upload_url;
  if (!uploadUrl) throw new Error("AssemblyAI upload failed — no upload_url returned");
  console.log("[ASSEMBLYAI] Audio uploaded:", uploadUrl.substring(0, 60) + "...");
  return uploadUrl;
};

/**
 * Upload a Buffer (in-memory audio) to AssemblyAI CDN
 * @param {Buffer} buffer - Audio data buffer
 * @returns {Promise<string>} upload_url
 */
export const uploadAudioBuffer = async (buffer) => {
  if (!API_KEY) throw new Error(" ASSEMBLY_AI_API_KEY missing");

  const response = await axios.post(`${BASE_URL}/upload`, buffer, {
    headers: {
      authorization: API_KEY,
      "content-type": "application/octet-stream",
      "transfer-encoding": "chunked",
    },
    maxBodyLength: Infinity,
    timeout: 60000,
  });

  const uploadUrl = response.data?.upload_url;
  if (!uploadUrl) throw new Error("AssemblyAI upload failed — no upload_url returned");
  console.log("[ASSEMBLYAI] Buffer uploaded:", uploadUrl.substring(0, 60) + "...");
  return uploadUrl;
};

/**
 * Submit a transcript job for a given audio URL
 * @param {string} audioUrl - URL to the audio file (AssemblyAI CDN or public URL)
 * @param {object} options - Optional AssemblyAI options (language_code, speaker_labels, etc.)
 * @returns {Promise<string>} transcript job id
 */
export const createTranscript = async (audioUrl, options = {}) => {
  const response = await axios.post(
    `${BASE_URL}/transcript`,
    {
      audio_url: audioUrl,
      language_detection: true, // Auto-detect language
      punctuate: true,
      format_text: true,
      ...options,
    },
    { headers: HEADERS, timeout: 15000 }
  );

  const id = response.data?.id;
  if (!id) throw new Error("AssemblyAI transcript creation failed — no ID returned");
  console.log("[ASSEMBLYAI] Transcript job created:", id);
  return id;
};

/**
 * Poll for transcript completion
 * @param {string} transcriptId - The transcript job ID
 * @returns {Promise<string>} Final transcribed text
 */
export const pollTranscript = async (transcriptId) => {
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const response = await axios.get(`${BASE_URL}/transcript/${transcriptId}`, {
      headers: HEADERS,
      timeout: 10000,
    });

    const { status, text, error } = response.data;
    console.log(`[ASSEMBLYAI] Poll status: ${status}`);

    if (status === "completed") {
      return text || "";
    }

    if (status === "error") {
      throw new Error(`AssemblyAI transcription error: ${error}`);
    }

    // status is "queued" or "processing" — keep polling
  }

  throw new Error("AssemblyAI transcription timed out after 2 minutes");
};

/**
 * Full transcription pipeline: file → upload → transcribe → wait → text
 * @param {string} filePath - Absolute path to audio file
 * @param {object} options - Optional AssemblyAI transcript options
 * @returns {Promise<{text: string, id: string}>}
 */
export const transcribeFile = async (filePath, options = {}) => {
  const uploadUrl = await uploadAudioFile(filePath);
  const transcriptId = await createTranscript(uploadUrl, options);
  const text = await pollTranscript(transcriptId);
  return { text, id: transcriptId };
};

/**
 * Full transcription pipeline from Buffer
 * @param {Buffer} buffer - Audio data buffer
 * @param {object} options - Optional AssemblyAI transcript options
 * @returns {Promise<{text: string, id: string}>}
 */
export const transcribeBuffer = async (buffer, options = {}) => {
  const uploadUrl = await uploadAudioBuffer(buffer);
  const transcriptId = await createTranscript(uploadUrl, options);
  const text = await pollTranscript(transcriptId);
  return { text, id: transcriptId };
};
