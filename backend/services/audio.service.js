import { createClient } from "@deepgram/sdk";

class AudioService {
  constructor() {
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
  }

  /**
   * Generate audio from text using DeepGram Nova-2
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async generateAudio(text) {
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
