# Kokoro TTS + Render Deployment Plan

## Problem Analysis

### Current Issue
- **Error**: DeepGram API returns "Input text exceeds maximum character limit of 2000"
- **Root Cause**: The summary text (4514 chars) is being sent directly to DeepGram without chunking
- **Note**: Chunking code exists in `audio.service.js` but the deployed server is running old code

### Immediate Fix (Before Kokoro)
1. **Restart backend server** to load the updated code with chunking logic
2. Test audio generation again

---

## Option 1: Use Current DeepGram with Chunking (Recommended First)

The current `audio.service.js` already has:
- Text chunking at 1800 chars per chunk
- Parallel processing for faster generation
- Markdown cleanup for better audio quality
- Max text limit of 6000 chars

**Action**: Restart the server and test. If it works, no need for Kokoro.

---

## Option 2: Kokoro TTS Integration (If DeepGram Still Fails)

### Why Kokoro?
- **Free**: Uses Hugging Face Inference API (free tier)
- **No character limit**: Processes any length text
- **High quality**: neural TTS voices
- **Offline capable**: Can run locally with ONNX

### Implementation Steps

#### Step 1: Add Dependencies
```bash
cd backend
npm install @huggingface/inference
```

#### Step 2: Update .env
```env
# Optional - Hugging Face for Kokoro (free tier)
HUGGING_FACE_API_KEY=your_hf_token
```

#### Step 3: Create Kokoro Audio Service
Create `backend/services/kokoro.service.js`:

```javascript
import { HfInference } from "@huggingface/inference";

class KokoroTTS {
  constructor() {
    this.client = new HfInference(process.env.HUGGING_FACE_API_KEY);
    this.voice = "amy"; // British female voice
  }

  async generate(text) {
    // Kokoro model on Hugging Face
    const result = await this.client.textToSpeech({
      model: "hexgrad/Kokoro-82M",
      inputs: text,
      parameters: {
        voice: this.voice
      }
    });
    
    // Result is a Blob, convert to Buffer
    return Buffer.from(await result.arrayBuffer());
  }
}

export default new KokoroTTS();
```

#### Step 4: Update audio.service.js with Fallback
Modify `generateAudio()` to try Kokoro first, then DeepGram:

```javascript
import kokoroService from "./kokoro.service.js";

// In generateAudio():
async generateAudio(text) {
  // Try Kokoro first (no char limit)
  if (process.env.HUGGING_FACE_API_KEY) {
    try {
      console.log("[AUDIO] Trying Kokoro TTS...");
      return await kokoroService.generate(text);
    } catch (err) {
      console.log("[AUDIO] Kokoro failed, trying DeepGram...", err.message);
    }
  }
  
  // Fallback to DeepGram with chunking
  return this.generateWithDeepGram(text);
}
```

---

## Render Free Tier Deployment

### Current Constraints
- **Free tier**: 750 hours/month (enough for dev)
- **Idle timeout**: Sleeps after 15 min of inactivity
- **No persistent storage**: Use S3 for audio files
- **Ephemeral filesystem**: All files deleted on restart

### Deployment Steps

#### 1. Prepare for Deploy
```bash
# Build frontend
cd frontend
npm run build

# Test locally
cd ../backend
npm start
```

#### 2. Create Render YML
Create `render.yaml` in root:

```yaml
services:
  - type: web
    name: backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: DEEPGRAM_API_KEY
        sync: false
      - key: OPENROUTER_API_KEY
        sync: false

  - type: static
    name: frontend
    buildCommand: cd frontend && npm install && npm run build
    publishDir: frontend/dist
```

#### 3. Environment Variables on Render
Set these in Render dashboard:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `DEEPGRAM_API_KEY`: Your DeepGram API key
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `NODE_ENV`: production

#### 4. Deploy
```bash
# Option 1: GitHub integration (recommended)
# Connect your repo to Render via dashboard

# Option 2: CLI
render deploy
```

---

## Cost Comparison

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **DeepGram** | $0/month (200 min) | 2000 char limit per request |
| **Kokoro (HF)** | Free (no limit) | Requires HF account |
| **Render** | 750 hrs/month | Sleeps after 15 min idle |
| **MongoDB Atlas** | 512 MB | Free cluster |

---

## Recommended Action Plan

1. **Immediate**: Restart backend server to load chunking code
2. **Test**: Generate audio with existing DeepGram implementation
3. **If DeepGram works**: Continue using it (simpler setup)
4. **If DeepGram fails**: Add Kokoro as fallback
5. **Deploy**: Push to Render with environment variables

---

## Files to Modify

| File | Change |
|------|--------|
| `backend/package.json` | Add `@huggingface/inference` |
| `backend/.env` | Add `HUGGING_FACE_API_KEY` |
| `backend/services/kokoro.service.js` | New file |
| `backend/services/audio.service.js` | Add Kokoro fallback |
| `render.yaml` | New file (or use dashboard) |

---

## Testing Checklist

- [ ] Restart backend server
- [ ] Upload PDF > 2000 chars
- [ ] Generate audio summary
- [ ] Verify audio plays correctly
- [ ] Test on Render (after deployment)
