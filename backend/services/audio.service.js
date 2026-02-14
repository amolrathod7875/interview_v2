import { createClient } from "@deepgram/sdk";
import axios from "axios";

class AudioService {
  constructor() {
    // DeepGram client
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

    // Hugging Face API - using direct axios calls for more control
    this.hfToken = process.env.HUGGING_FACE_API_KEY;
    this.hfBaseUrl = "https://router.huggingface.co";
    this.kokoroModel = "KokoroAI/kokoro-v1-8x7b-zh"; // Correct model path
    
    // Configuration - optimized for faster generation
    this.maxChunkSize = 500; // Smaller chunks for Kokoro (more reliable)
    this.deepGramChunkSize = 1800; // Larger for DeepGram
    this.maxTextLength = 6000; // Keep audio reasonable (about 4-5 min max)
    this.enableParallelProcessing = true; // Process chunks in parallel
    this.kokoroMaxRetries = 3; // Retry Kokoro on failure
  }

  /**
   * Split text into chunks at sentence boundaries
   * @param {string} text - The text to split
   * @param {number} maxSize - Maximum chunk size (optional, uses default)
   * @returns {string[]} Array of text chunks
   */
  splitTextIntoChunks(text, maxSize = null) {
    const chunkSize = maxSize || this.maxChunkSize;
    
    // Truncate if too long
    if (text.length > this.maxTextLength) {
      text = text.substring(0, this.maxTextLength);
    }

    // If text fits in one chunk, return as-is
    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks = [];
    
    // Split by sentence-ending punctuation
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex) || [text];
    
    let currentChunk = "";
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed chunk size, start new chunk
      if (currentChunk.length + sentence.length > chunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        
        // If single sentence is too long, hard split it
        if (sentence.length > chunkSize) {
          const hardChunks = this.hardSplit(sentence, chunkSize);
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
   * @param {number} chunkSize - Maximum chunk size
   * @returns {string[]} Array of chunks
   */
  hardSplit(text, chunkSize = null) {
    const size = chunkSize || this.maxChunkSize;
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.substring(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate audio from text using Kokoro TTS (Hugging Face)
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async generateKokoroAudio(text, retryCount = 0) {
    try {
      console.log(`[KOKORO] Generating audio for ${text.length} characters`);
      
      // Use smaller chunks for Kokoro (500 chars) for more reliable processing
      const chunks = this.splitTextIntoChunks(text, 500);
      console.log(`[KOKORO] Split into ${chunks.length} chunks (500 chars each)`);
      
      if (chunks.length === 1) {
        // Single chunk - direct API call
        const audioBuffer = await this.callKokoroAPI(chunks[0]);
        return audioBuffer;
      } else if (this.enableParallelProcessing) {
        // Multiple chunks - process in parallel for faster generation
        console.log(`[KOKORO] Processing ${chunks.length} chunks in parallel...`);
        const audioBuffers = await Promise.all(
          chunks.map(chunk => this.callKokoroAPI(chunk))
        );
        
        // Combine all buffers
        return this.combineAudioBuffers(audioBuffers);
      } else {
        // Multiple chunks - process sequentially (fallback)
        const audioBuffers = [];
        for (let i = 0; i < chunks.length; i++) {
          console.log(`[KOKORO] Processing chunk ${i + 1}/${chunks.length}`);
          const chunkBuffer = await this.callKokoroAPI(chunks[i]);
          audioBuffers.push(chunkBuffer);
        }
        
        // Combine all buffers
        return this.combineAudioBuffers(audioBuffers);
      }
    } catch (error) {
      console.error("[KOKORO] Error generating audio:", error.message);
      
      // Retry logic
      if (retryCount < this.kokoroMaxRetries) {
        console.log(`[KOKORO] Retrying... (${retryCount + 1}/${this.kokoroMaxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.generateKokoroAudio(text, retryCount + 1);
      }
      
      throw error;
    }
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
   * Call Hugging Face Kokoro API with retry logic
   * @param {string} text - Text to convert
   * @returns {Promise<Buffer>} Audio buffer
   */
  async callKokoroAPI(text) {
    try {
      // Clean the text first
      const cleanedText = this.cleanTextForAudio(text);
      console.log(`[KOKORO] Cleaned text length: ${cleanedText.length}`);
      
      // Use Kokoro model via Hugging Face router API with specific voice and slower speed
      const response = await axios.post(
        `${this.hfBaseUrl}/models/${this.kokoroModel}`,
        {
          inputs: cleanedText,
          parameters: {
            voice: "af_nicole", // Professional female voice
            speed: 0.9 // Slightly slower for clarity
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.hfToken}`,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer",
          timeout: 60000 // 60 second timeout
        }
      );

      // Convert response to buffer
      return Buffer.from(response.data);
    } catch (error) {
      console.error("[KOKORO API] Error:", error.message);
      throw error;
    }
  }

  /**
   * Combine multiple audio buffers into one
   * @param {Buffer[]} buffers - Array of audio buffers
   * @returns {Promise<Buffer>} Combined audio buffer
   */
  combineAudioBuffers(buffers) {
    // Simply concatenate all buffers
    return Buffer.concat(buffers);
  }

  /**
   * Generate audio from text using DeepGram Nova-2
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async generateDeepGramAudio(text) {
    try {
      // DeepGram Text-to-Speech API call
      const response = await this.deepgram.speak.request(
        { text },
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
   * Main generateAudio function with fallback chain
   * 1. Try Kokoro TTS (Hugging Face) - handles long text via chunking
   * 2. Fallback to DeepGram if Kokoro fails
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async generateAudio(text) {
    console.log(`[AUDIO] Generating audio for ${text.length} characters`);
    
    // Try Kokoro first
    try {
      console.log("[AUDIO] Trying Kokoro TTS (Hugging Face)...");
      const audioBuffer = await this.generateKokoroAudio(text);
      console.log(`[AUDIO] Kokoro TTS success: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } catch (kokoroError) {
      console.error("[AUDIO] Kokoro failed:", kokoroError.message);
      
      // Fallback to DeepGram
      try {
        console.log("[AUDIO] Falling back to DeepGram TTS...");
        
        // For DeepGram, use larger chunks (1800 chars)
        if (text.length > 2000) {
          console.log("[AUDIO] Text too long for DeepGram, chunking...");
          const chunks = this.splitTextIntoChunks(text, this.deepGramChunkSize);
          
          // Process in parallel for faster generation
          console.log(`[AUDIO] Processing ${chunks.length} DeepGram chunks in parallel...`);
          const audioBuffers = await Promise.all(
            chunks.map(chunk => this.generateDeepGramAudio(chunk))
          );
          
          return this.combineAudioBuffers(audioBuffers);
        } else {
          const audioBuffer = await this.generateDeepGramAudio(text);
          console.log(`[AUDIO] DeepGram TTS success: ${audioBuffer.length} bytes`);
          return audioBuffer;
        }
      } catch (deepgramError) {
        console.error("[AUDIO] DeepGram also failed:", deepgramError.message);
        throw new Error(`Failed to generate audio: ${kokoroError.message}, ${deepgramError.message}`);
      }
    }
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
