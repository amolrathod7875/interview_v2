import { createClient } from "@deepgram/sdk";

class AudioService {
  constructor() {
    // DeepGram client (lazy / guarded init)
    this.deepgram = null;
    if (!process.env.DEEPGRAM_API_KEY) {
      console.warn("[AUDIO] DEEPGRAM_API_KEY not set — audio features disabled");
    } else {
      try {
        this.deepgram = createClient(process.env.DEEPGRAM_API_KEY, {
          fetchOptions: {
            agent: (href, options) => {
              const { https } = require('https');
              return new https.Agent({
                ...options,
                timeout: 60000, // 60 second timeout
                keepAlive: true,
              });
            }
          }
        });
      } catch (err) {
        console.error('[AUDIO] Failed to initialize DeepGram client:', err.message || err);
        this.deepgram = null;
      }
    }
    
    // Configuration - optimized for faster generation
    this.maxChunkSize = 1800; // Characters per chunk (close to DeepGram's 2000 limit)
    this.maxTextLength = 6000; // Keep audio reasonable (about 4-5 min max)
    this.enableParallelProcessing = true; // Process chunks in parallel
  }

  /**
   * Split text into chunks at sentence boundaries
   * @param {string} text - The text to split
   * @returns {string[]} Array of text chunks
   */
  splitTextIntoChunks(text) {
    // Truncate if too long
    if (text.length > this.maxTextLength) {
      text = text.substring(0, this.maxTextLength);
    }

    // If text fits in one chunk, return as-is
    if (text.length <= this.maxChunkSize) {
      return [text];
    }

    const chunks = [];
    
    // Split by sentence-ending punctuation
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex) || [text];
    
    let currentChunk = "";
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed chunk size, start new chunk
      if (currentChunk.length + sentence.length > this.maxChunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        
        // If single sentence is too long, hard split it
        if (sentence.length > this.maxChunkSize) {
          const hardChunks = this.hardSplit(sentence);
          chunks.push(...hardChunks.slice(0, -1)); // Add all but last
          currentChunk = hardChunks[hardChunks.length - 1];
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += sentence;
      }
    }
    
    // Add remaining chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Hard split text at character limit
   * @param {string} text - The text to split
   * @returns {string[]} Array of chunks
   */
  hardSplit(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += this.maxChunkSize) {
      chunks.push(text.substring(i, i + this.maxChunkSize));
    }
    return chunks;
  }

  /**
   * Clean text by removing markdown formatting
   * @param {string} text - The text to clean
   * @returns {string} Cleaned text
   */
  cleanTextForAudio(text) {
    // Remove markdown headers (# ## etc)
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove bold markers (**text** -> text)
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // Remove italic markers (*text* -> text)
    text = text.replace(/\*([^*]+)\*/g, '$1');
    
    // Remove inline code markers (`code` -> code)
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // Remove bullet points (- or * at start of line)
    text = text.replace(/^[\\-\\*]\s+/gm, '');
    
    // Remove excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
  }

  /**
   * Generate audio from text using DeepGram Nova-2
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async generateDeepGramAudio(text) {
    try {
      if (!this.deepgram) {
        throw new Error("DeepGram API key not configured");
      }
      // Clean text first
      const cleanedText = this.cleanTextForAudio(text);
      
      // DeepGram Text-to-Speech API call
      const response = await this.deepgram.speak.request(
        { text: cleanedText },
        {
          model: "aura-asteria-en", // Nova-2 model for natural voice
          encoding: "mp3",
        }
      );

      // Get audio stream
      const stream = await response.getStream();

      if (!stream) {
        throw new Error("Failed to get audio stream from DeepGram");
      }

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error("DeepGram audio generation error:", error);
      throw new Error(`Failed to generate audio: ${error.message}`);
    }
  }

  /**
   * Main generateAudio function - DeepGram only with chunking
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async generateAudio(text) {
    console.log(`[AUDIO] Generating audio for ${text.length} characters`);
    
    // For text that fits in one chunk, direct API call
    if (text.length <= this.maxChunkSize) {
      console.log("[AUDIO] Text fits in single chunk, processing directly...");
      const audioBuffer = await this.generateDeepGramAudio(text);
      console.log(`[AUDIO] DeepGram TTS success: ${audioBuffer.length} bytes`);
      return audioBuffer;
    }
    
    // For longer text, split into chunks and process in parallel
    console.log("[AUDIO] Text too long, chunking and processing in parallel...");
    const chunks = this.splitTextIntoChunks(text);
    console.log(`[AUDIO] Split into ${chunks.length} chunks`);
    
    // Process in parallel for faster generation
    const audioBuffers = await Promise.all(
      chunks.map((chunk, index) => {
        console.log(`[AUDIO] Processing chunk ${index + 1}/${chunks.length}`);
        return this.generateDeepGramAudio(chunk);
      })
    );
    
    // Combine all buffers
    const combinedBuffer = Buffer.concat(audioBuffers);
    console.log(`[AUDIO] Combined audio: ${combinedBuffer.length} bytes`);
    
    return combinedBuffer;
  }

  /**
   * Generate audio and save to file
   * @param {string} text - The text to convert
   * @param {string} filePath - Output file path
   * @returns {Promise<string>} File path
   */
  async generateAndSaveAudio(text, filePath) {
    const audioBuffer = await this.generateAudio(text);

    const fs = await import("fs");
    const path = await import("path");

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, audioBuffer);
    return filePath;
  }
}

export default new AudioService();
