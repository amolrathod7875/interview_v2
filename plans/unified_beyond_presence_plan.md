# Unified Beyond Presence API Integration Plan

## Executive Summary

This plan outlines the refactoring of the AI Mock Interview feature from a "split-brain" architecture (VAPI for voice + LiveKit for video) to a unified architecture using the **Beyond Presence API** which natively streams both audio and video via LiveKit.

---

## 1. Architecture Overview

### Current Architecture (Split-Brain)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│  ┌──────────────────┐           ┌──────────────────────────────────┐  │
│  │   VAPI (Voice)   │           │    LiveKit + 3D Avatar (Video)  │  │
│  │   - Transcription│           │    - Video track only           │  │
│  │   - TTS          │           │    - Audio MUTED                │  │
│  │   - LLM          │           │                                  │  │
│  └────────┬─────────┘           └──────────────┬───────────────────┘  │
│           │                                   │                       │
│           │           PROBLEMS:               │                       │
│           │  - Latency between voice/video    │                       │
│           │  - Lip-sync issues                │                       │
│           │  - Two separate services          │                       │
│           └───────────────┬───────────────────┘                       │
│                           ▼                                           │
│                 ┌─────────────────────┐                               │
│                 │   aiInterview.jsx   │                               │
│                 │   (Coordination)    │                               │
│                 └─────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               BACKEND                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │           beyondPresenceRoute.js (Session Creation Only)        │  │
│  │           - Creates BP session                                  │  │
│  │           - No LLM/TTS config passed                           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Target Architecture (Unified)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              BeyondPresenceAvatar.jsx                            │  │
│  │              (Unified Audio + Video)                             │  │
│  │  - Video track from LiveKit                                     │  │
│  │  - Audio track from LiveKit ◄── NEW                             │  │
│  │  - Data Channel listener for STT transcripts ◄── NEW            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                    │
│                                    │                                    │
│                 ┌──────────────────┴──────────────────┐               │
│                 │         aiInterview.jsx              │               │
│                 │  - Removed VAPI completely           │               │
│                 │  - Captures transcripts via           │               │
│                 │    LiveKit Data Channel ◄── NEW       │               │
│                 │  - State array for user answers      │               │
│                 └──────────────────┬───────────────────┘               │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               BACKEND                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              beyondPresenceRoute.js                                │ │
│  │              (Enhanced with API Key Rotation) ◄── NEW            │ │
│  │  - BP_API_KEYS array rotation                                     │ │
│  │  - Pass LLM config (system prompt, questions) ◄── NEW            │ │
│  │  - Pass TTS config (OpenAI/ElevenLabs) ◄── NEW                  │ │
│  │  - 402/429 error handling with failover                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│                                    ▼                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              cohere.service.js                                    │ │
│  │              (Post-Interview Evaluation)                          │ │
│  │  - Receives transcript array                                     │ │
│  │  - Generates feedback report                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Configuration Updates

### 2.1 Backend `.env` Updates

**Current:**
```env
BEYOND_PRESENCE_API_KEY=sk-6ULxrE20g1LMy7YGOIrzYeKPGMPlfSu15T5hfkrL5M8
BEYOND_PRESENCE_API_KEY_1=sk-ldrrGl4BYjH4I9W7oiir2kNq67sVDlzq1F4kAuTJvsI
BEYOND_PRESENCE_API_KEY_2=sk-FRnSmcTl0tmHCr9I6MdUVGqxw_gB3Ac0-AVHv9XrK1s
BEYOND_PRESENCE_API_KEY_3=
```

**Updated:**
```env
# Beyond Presence API Keys - Supports up to 8 keys for hackathon failover
# Format 1: Comma-separated (recommended)
BP_API_KEYS=sk-6ULxrE20g1LMy7YGOIrzYeKPGMPlfSu15T5hfkrL5M8,sk-ldrrGl4BYjH4I9W7oiir2kNq67sVDlzq1F4kAuTJvsI,sk-FRnSmcTl0tmHCr9I6MdUVGqxw_gB3Ac0-AVHv9XrK1s

# Format 2: Individual keys (legacy - still supported)
# BEYOND_PRESENCE_API_KEY=sk-6ULxrE20g1LMy7YGOIrzYeKPGMPlfSu15T5hfkrL5M8
# BEYOND_PRESENCE_API_KEY_1=sk-ldrrGl4BYjH4I9W7oiir2kNq67sVDlzq1F4kAuTJvsI
# BEYOND_PRESENCE_API_KEY_2=sk-FRnSmcTl0tmHCr9I6MdUVGqxw_gB3Ac0-AVHv9XrK1s
# ... up to BEYOND_PRESENCE_API_KEY_8

BEYOND_PRESENCE_AVATAR_ID=b9be11b8-89fb-4227-8f86-4a881393cbdb
BEYOND_PRESENCE_AGENT_ID=e609308e-291d-4505-b360-c87c2db564f8
```

> **CRITICAL**: Each API key has its own separate Beyond Presence account with its own agents. The backend now uses `_agentCache` dictionary to map each API key to its own agent_id, ensuring zero crashes when key failover occurs.

### 2.2 Frontend `.env` Updates

**Remove VAPI:**
```env
# REMOVE THIS LINE - VAPI is no longer used
# VITE_VAPI_PUBLIC_KEY=05b34d67-900c-40de-ade2-25d88ce2c936
```

---

## 3. Backend Implementation

### 3.1 Modified File: `backend/routes/beyondPresenceRoute.js`

**New functionality:**
1. API key rotation with automatic failover on 402/429 errors
2. Pass LLM instructions (system prompt + questions) to Beyond Presence
3. Pass TTS configuration (OpenAI or ElevenLabs)
4. Accept custom agent configuration from frontend

**Complete Updated Code:**

```javascript
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Use native fetch in Node 18+

dotenv.config();

const router = express.Router();

// NEW: Per-Key Agent Cache - Each API key gets its own agent_id
// This is CRITICAL for hackathon failover: when key 1 fails and we switch
// to key 2, we must create/use a separate agent_id for key 2
const _agentCache = {};

// ─────────────────────────────────────────────────────────────────────────
// API KEY ROTATION LOGIC (Hackathon Strategy - Handles 1 through 8 automatically)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Dynamically collect all Beyond Presence API keys from env
 * Supports: BEYOND_PRESENCE_API_KEY, BP_API_KEYS, and BEYOND_PRESENCE_API_KEY_1..8
 * @returns {string[]} Array of API keys in priority order
 */
function getBpApiKeys() {
  const keys = [];
  
  // First: Check for comma-separated BP_API_KEYS (new format)
  if (process.env.BP_API_KEYS) {
    const bpKeys = process.env.BP_API_KEYS.split(',')
      .map(k => k.trim())
      .filter(k => k);
    keys.push(...bpKeys);
  }
  
  // Second: Check legacy base key
  if (process.env.BEYOND_PRESENCE_API_KEY) {
    keys.push(process.env.BEYOND_PRESENCE_API_KEY);
  }
  
  // Third: Check BEYOND_PRESENCE_API_KEY_1 through 8
  for (let i = 1; i <= 8; i++) {
    const key = process.env[`BEYOND_PRESENCE_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  
  // Deduplicate while preserving order
  const uniqueKeys = [...new Set(keys)];
  
  if (uniqueKeys.length === 0) {
    throw new Error('No Beyond Presence API keys configured in .env');
  }
  
  return uniqueKeys;
}

/**
 * Make a Beyond Presence API request with automatic key rotation
 * CRITICAL: This function handles per-key agent creation automatically
 * On 402 (Payment Required/Out of Credits) or 429 (Too Many Requests),
 * automatically switches to next key and retries with that key's agent
 * 
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @param {object} options - Additional options
 * @param {boolean} options.requiresAgent - If true, ensures agent exists for current key
 * @param {object} options.agentConfig - Agent configuration if creating new agent
 * @returns {Promise<object>} API response JSON
 */
async function bpRequestWithKeyRotation(endpoint, method = 'POST', body = null, options = {}) {
  const { requiresAgent = false, agentConfig = {} } = options;
  const keys = getBpApiKeys();
  let lastError = null;
  
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[attempt];
    
    try {
      // If this request requires an agent, ensure we have one for this specific key
      let finalBody = body;
      if (requiresAgent && (endpoint === '/v1/calls' || endpoint === '/v1/agents')) {
        const agentId = await ensureAgentForKey(apiKey, agentConfig);
        
        // If creating a call, inject the agent_id
        if (endpoint === '/v1/calls') {
          finalBody = { ...body, agent_id: agentId };
        }
      }
      
      const fetchOptions = {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': apiKey 
        }
      };
      
      if (finalBody) {
        fetchOptions.body = JSON.stringify(finalBody);
      }
      
      const response = await fetch(`https://api.bey.dev${endpoint}`, fetchOptions);
      
      // Success - return response with the key used (useful for debugging)
      if (response.ok) {
        const result = await response.json();
        return { ...result, _apiKeyIndex: attempt };
      }
      
      const status = response.status;
      const errorText = await response.text();
      
      console.warn(`[BP] Key ${attempt + 1}/${keys.length} (${apiKey.substring(0, 8)}...) failed with ${status}`);
      
      // Check for retryable errors
      if (status === 402 || status === 429) {
        // Clear cached agent for this key since it might be invalid
        delete _agentCache[apiKey];
        console.warn(`[BP] Switching to next key after ${status}...`);
        lastError = new Error(`BP API ${status}: ${errorText}`);
        continue; // Try next key
      }
      
      // 401/403 - Key is invalid/unauthorized for this resource
      if (status === 401 || status === 403) {
        delete _agentCache[apiKey];
        lastError = new Error(`BP API ${status}: Unauthorized - key may be invalid`);
        continue; // Try next key
      }
      
      // 404 - Agent not found (can happen if using cached agent from wrong key)
      if (status === 404) {
        delete _agentCache[apiKey];
        lastError = new Error(`BP API ${status}: Agent not found - will retry with new agent`);
        continue; // Try with new agent for this key
      }
      
      // Non-retryable error - throw immediately
      throw new Error(`BP API ${status}: ${errorText}`);
      
    } catch (error) {
      // Network errors or other issues - try next key
      console.warn(`[BP] Key ${attempt + 1}/${keys.length} error: ${error.message}`);
      lastError = error;
      continue;
    }
  }
  
  // All keys exhausted
  throw new Error(`All ${keys.length} Beyond Presence API keys failed. Last error: ${lastError?.message}`);
}

// ─────────────────────────────────────────────────────────────────────────
// PER-KEY AGENT MANAGEMENT (CRITICAL for Failover)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Ensure a BP managed agent exists for a SPECIFIC API KEY
 * This is called with each key during failover to create/retrieve the
 * correct agent for that specific key's account
 * 
 * @param {string} apiKey - The specific API key to create agent for
 * @param {object} config - Agent configuration
 * @returns {Promise<string>} Agent ID
 */
async function ensureAgentForKey(apiKey, config = {}) {
  // If we already created an agent for this specific key, use it!
  if (_agentCache[apiKey]) {
    console.log(`[BP] Using cached agent ${_agentCache[apiKey]} for key ${apiKey.substring(0, 8)}...`);
    return _agentCache[apiKey];
  }

  const avatarId = process.env.BEYOND_PRESENCE_AVATAR_ID;
  if (!avatarId) throw new Error('Missing BEYOND_PRESENCE_AVATAR_ID');

  // Build agent configuration
  const agentConfig = {
    name: 'AI Interviewer',
    avatar_id: avatarId,
    system_prompt: config.systemPrompt || 
      'You are a professional AI technical interviewer. Conduct a structured interview by asking one question at a time about the candidate\'s skills, experience, and problem-solving ability. Be encouraging, concise, and professional.',
    language: 'en',
    greeting: config.greeting || 'Hello! I am your AI interviewer today. Are you ready to begin?',
    llm: config.llm || { type: 'openai' },
  };

  // Add TTS config if provided
  if (config.tts) {
    agentConfig.tts = config.tts;
  }

  console.log(`[BP] Creating new agent for key ${apiKey.substring(0, 8)}... with avatar ${avatarId}`);

  const response = await fetch('https://api.bey.dev/v1/agents', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'x-api-key': apiKey 
    },
    body: JSON.stringify(agentConfig)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create agent for key: ${response.status} - ${err}`);
  }

  const result = await response.json();
  
  // CRITICAL: Cache this agent ID to THIS SPECIFIC API KEY
  _agentCache[apiKey] = result.id;
  console.log(`[BP] Created agent ${result.id} and cached for key ${apiKey.substring(0, 8)}...`);
  
  return result.id;
}

// ─────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────

/**
 * POST /api/beyondpresence/create-session
 * 
 * Creates a Beyond Presence call session with full configuration
 * 
 * Request Body:
 * {
 *   // Optional: Custom LLM configuration
 *   llm?: {
 *     provider: 'openai' | 'anthropic' | 'cohere',
 *     model?: string,
 *     systemPrompt?: string,
 *   },
 *   
 *   // Optional: Custom TTS configuration  
 *   tts?: {
 *     provider: 'openai' | 'elevenlabs',
 *     voiceId?: string,
 *   },
 *   
 *   // Optional: Custom greeting
 *   greeting?: string,
 *   
 *   // Optional: Interview questions to inject into system prompt
 *   questions?: string[],
 *   
 *   // Optional: Interview config for prompt engineering
 *   interviewConfig?: {
 *     topic: string,
 *     noOfQuestions: number,
 *     experience: string,
 *   }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   callId: string,
 *   livekitUrl: string,
 *   clientToken: string,
 * }
 */
router.post('/create-session', async (req, res) => {
  try {
    const { 
      llm, 
      tts, 
      greeting, 
      questions, 
      interviewConfig 
    } = req.body;

    // Build enhanced system prompt with questions if provided
    let systemPrompt = llm?.systemPrompt;
    
    if (questions && questions.length > 0 && interviewConfig) {
      systemPrompt = `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.

CRITICAL RULE: Ask EXACTLY ${interviewConfig.noOfQuestions} questions. NOT ${interviewConfig.noOfQuestions + 1}, NOT ${interviewConfig.noOfQuestions - 1}. EXACTLY ${interviewConfig.noOfQuestions}. Count each question you ask and STOP at ${interviewConfig.noOfQuestions}.

You have EXACTLY ${interviewConfig.noOfQuestions} questions available. DO NOT create new questions. ONLY use the provided questions below.

Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below are the ONLY questions you must ask:
Questions: ${questions.join(' ')}

If the candidate struggles, offer hints or rephrase the question without giving away the direct answer.

Provide brief 1-2 lined (30-40 worded), encouraging feedback after each answer.

Keep the conversation natural and engaging — use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"

After EXACTLY ${interviewConfig.noOfQuestions} questions (count them: 1, 2, 3... up to ${interviewConfig.noOfQuestions}), IMMEDIATELY wrap up the interview.

After ending with questions, provide feedback based upon user's answers, communication skills, and completeness of answers also, rate user's overall performance out of 100 and let user know that.

Key Guidelines:
• Be friendly, engaging, and witty
• Keep responses short and natural, like a real conversation
• Adapt based on the candidate's confidence level
• Take questions from interview from provided questions only
• Dont invent your own questions
`;
    }

    // Build LLM configuration
    const llmConfig = {
      type: llm?.provider || 'openai',
      ...(llm?.model && { model: llm.model }),
      ...(systemPrompt && { system_prompt: systemPrompt }),
    };

    // Build TTS configuration if provided
    const ttsConfig = tts ? {
      provider: tts.provider || 'openai',
      ...(tts.voiceId && { voice_id: tts.voiceId }),
    } : undefined;

    // Ensure agent exists with custom config
    const agentId = await ensureAgent({
      systemPrompt,
      greeting,
      llm: llmConfig,
      ...(ttsConfig && { tts: ttsConfig }),
    });

    console.log('[BP] Creating call with agent_id:', agentId);

    // Create the call via Beyond Presence API with key rotation
    const call = await bpRequestWithKeyRotation('/v1/calls', 'POST', { 
      agent_id: agentId,
      // Additional BP-specific options can go here
    });

    console.log('[BP] Call created:', call.id, '| livekit_url:', call.livekit_url ? 'present' : 'MISSING');

    res.json({
      success: true,
      callId: call.id,
      livekitUrl: call.livekit_url,
      clientToken: call.livekit_token,
    });
  } catch (err) {
    console.error('[BP] create-session error:', err);
    res.status(500).json({ 
      error: 'Failed to create session', 
      message: err.message,
      details: err.stack
    });
  }
});

/**
 * GET /api/beyondpresence/status
 */
router.get('/status', (req, res) => {
  const keys = getBpApiKeys();
  res.json({
    configured: !!(
      process.env.BEYOND_PRESENCE_AVATAR_ID && 
      keys.length > 0
    ),
    cachedAgentId: _cachedAgentId || 'not created yet',
    availableKeys: keys.length,
  });
});

/**
 * POST /api/beyondpresence/test-keys
 * Test all configured API keys
 */
router.post('/test-keys', async (req, res) => {
  const keys = getBpApiKeys();
  const results = [];
  
  for (let i = 0; i < keys.length; i++) {
    try {
      const response = await fetch('https://api.bey.dev/v1/agents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': keys[i] 
        },
        body: JSON.stringify({ 
          // Minimal request to test key validity
          name: 'key-test',
          avatar_id: process.env.BEYOND_PRESENCE_AVATAR_ID || 'test',
        }),
      });
      
      results.push({
        keyIndex: i + 1,
        status: response.status,
        success: response.ok,
        error: response.ok ? null : await response.text().catch(() => 'Unknown error'),
      });
    } catch (error) {
      results.push({
        keyIndex: i + 1,
        status: 'NETWORK_ERROR',
        success: false,
        error: error.message,
      });
    }
  }
  
  res.json({ results });
});

export default router;
```

---

## 4. Frontend Implementation

### 4.1 Modified File: `frontend/src/components/aiInterview.jsx`

**Changes Required:**
1. Remove VAPI import and initialization
2. Remove all VAPI event handlers
3. Remove VAPI start/stop calls
4. Add LiveKit Data Channel listener for transcripts
5. Store user answers in state array
6. Pass interview config to backend when creating session

**Key Code Changes:**

```jsx
// REMOVE THESE LINES:
// import Vapi from "@vapi-ai/web"
// const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY)

// ADD NEW STATE:
const [transcripts, setTranscripts] = useState([])        // All user transcripts
const [currentTranscript, setCurrentTranscript] = useState('') // Current speaking
const [isAiSpeaking, setIsAiSpeaking] = useState(false)   // AI speaking state

// REMOVE VAPI EFFECT (lines 169-231) AND REPLACE WITH:
useEffect(() => {
  // This effect now handles transcript collection from LiveKit Data Channel
  // The actual implementation is in BeyondPresenceAvatar.jsx which exposes
  // transcript data via callbacks or shared context
}, [])

// MODIFIED startInterview FUNCTION:
const startInterview = async () => {
  setLoading(true)

  try {
    // Pre-warm BP session with full interview configuration
    const res = await fetch(`${API}/api/beyondpresence/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Pass LLM configuration
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
        // Pass TTS configuration
        tts: {
          provider: 'elevenlabs',
          voiceId: 'burt',
        },
        // Pass interview questions to backend for prompt injection
        questions: parsedQuestionsRef.current,
        interviewConfig: {
          topic: interview.topic,
          noOfQuestions: noOfQuestions,
          experience: state?.experience || 'mid',
        },
        // Custom greeting
        greeting: `Hi ${user?.name || user?.firstName || 'there'}, how are you? Ready for your interview on ${interview.topic || 'for your selected topic'}?`,
      }),
    })
    
    if (res.ok) {
      const data = await res.json()
      bpSessionRef.current = data
      console.log('[BP] Call pre-created with full config:', data.callId)
    }
  } catch (e) {
    console.warn('[BP] Pre-warm failed:', e.message)
  }

  // VAPI START REMOVED - Avatar will connect via BeyondPresenceAvatar component
  setIsActive(true)
  setLoading(false)
}

// MODIFIED hangUpInterview FUNCTION:
const hangUpInterview = async () => {
  try {
    setIsCompleted(true)
    setIsActive(false)
    
    // Capture final transcript if user is still speaking
    if (currentTranscript.trim()) {
      const finalAnswers = [...transcripts, currentTranscript.trim()]
      setTranscripts(finalAnswers)
      
      // Save answers to backend (triggers Cohere evaluation)
      const answerResp = await axios.post(`${API}/answers/add`, { 
        interviewId: interviewId, 
        answers: finalAnswers 
      })
      
      if (answerResp.data.success) {
        navigate('/postinterview', { state: { interviewId: interviewId } })
      } else {
        navigate('/dashboard')
      }
    } else {
      // No current transcript, use accumulated transcripts
      const answerResp = await axios.post(`${API}/answers/add`, { 
        interviewId: interviewId, 
        answers: transcripts 
      })
      
      if (answerResp.data.success) {
        navigate('/postinterview', { state: { interviewId: interviewId } })
      } else {
        navigate('/dashboard')
      }
    }
    
    // Update interview status
    await axios.put(`${API}/interview/update/${interviewId}`)
  } catch (e) {
    console.log(e)
    navigate('/dashboard')
  }
}
```

### 4.2 Modified File: `frontend/src/components/BeyondPresenceAvatar.jsx`

**Changes Required:**
1. Add audio track subscription (previously ignored)
2. Listen to LiveKit Data Channel for STT transcripts
3. Expose transcript data to parent component via callback
4. Handle audio playback from BP agent

**Key Code Changes:**

```jsx
import { 
  useEffect, 
  useRef, 
  useState, 
  useCallback 
} from 'react'
import { 
  Room, 
  RoomEvent,
  DataPacket,
  DataPacketKind 
} from 'livekit-client'

// NEW PROPS:
export default function BeyondPresenceAvatar({
  isSpeaking = false,
  showAvatar = true,
  sessionData = null,
  // NEW: Callbacks for transcript data
  onTranscriptUpdate = () => {},
  onAiSpeakingChange = () => {},
}) {
  // EXISTING STATE:
  const videoRef = useRef(null)
  const audioRef = useRef(null)     // NEW: Audio element ref
  const roomRef = useRef(null)
  const pollRef = useRef(null)
  const sessionRef = useRef(sessionData)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [videoAttached, setVideoAttached] = useState(false)
  const [audioAttached, setAudioAttached] = useState(false)  // NEW

  // ── Attach audio track to <audio> element ─────────────────────────────────
  const attachAudio = useCallback((track) => {
    const doIt = () => {
      const audioEl = audioRef.current || document.createElement('audio')
      track.attach(audioEl)
      audioEl.autoplay = true
      audioEl.playsInline = true
      audioEl.volume = 1.0  // Full volume for AI voice
      
      if (!audioRef.current) {
        audioRef.current = audioEl
        document.body.appendChild(audioEl)
      }
      
      setAudioAttached(true)
      console.log('[BP] Avatar audio attached')
    }
    
    if (audioRef.current || document.readyState === 'complete') {
      doIt()
    } else {
      window.addEventListener('load', doIt)
    }
  }, [])

  // ── Handle Data Channel messages for STT transcripts ─────────────────────
  const handleDataMessage = useCallback((payload, kind) => {
    // Only process binary data packets
    if (kind !== DataPacketKind.Binary) return
    
    try {
      // Decode the binary payload
      const decoder = new TextDecoder()
      const text = decoder.decode(payload)
      const data = JSON.parse(text)
      
      // Handle different transcript types based on BP's message format
      // This depends on Beyond Presence's actual Data Channel protocol
      
      if (data.type === 'transcript') {
        if (data.transcriptType === 'partial') {
          // Interim transcript - user is still speaking
          onTranscriptUpdate({
            type: 'partial',
            text: data.transcript,
            role: data.role, // 'user' or 'assistant'
          })
        } else if (data.transcriptType === 'final') {
          // Final transcript - speech completed
          onTranscriptUpdate({
            type: 'final',
            text: data.transcript,
            role: data.role,
            timestamp: Date.now(),
          })
        }
      }
      
      // Handle speech state events
      if (data.type === 'speech_start') {
        onAiSpeakingChange(data.role === 'assistant')
      }
      
      if (data.type === 'speech_end') {
        onAiSpeakingChange(false)
      }
      
    } catch (err) {
      // Not all data messages are JSON - some may be control messages
      console.log('[BP] Non-JSON data message received')
    }
  }, [onTranscriptUpdate, onAiSpeakingChange])

  // ── Scan for audio tracks ────────────────────────────────────────────────
  const scanForAudioTracks = useCallback((room) => {
    let found = false
    room.remoteParticipants.forEach(p => {
      p.trackPublications.forEach(pub => {
        if (pub.track?.kind === 'audio') {
          found = true
          attachAudio(pub.track)
        } else if (pub.kind === 'audio' && !pub.isSubscribed) {
          pub.setSubscribed(true)
        }
      })
    })
    return found
  }, [attachAudio])

  // ── Connect function with audio and data channel ────────────────────────
  const connect = useCallback(async () => {
    if (!showAvatar) return
    
    // ... existing setup code ...
    
    // NEW: Handle Data Channel messages
    room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
      console.log('[BP] Data received:', kind)
      handleDataMessage(payload, kind)
    })

    // MODIFIED: TrackSubscribed - include audio
    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
      console.log(`[BP] Track subscribed: ${track.kind} from "${participant.identity}"`)
      
      if (track.kind === 'video') {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        attachVideo(track)
      }
      
      // NEW: Handle audio track subscription
      if (track.kind === 'audio') {
        attachAudio(track)
      }
    })

    // MODIFIED: Connected handler - scan for audio too
    room.on(RoomEvent.Connected, async () => {
      console.log('[BP] Connected to LiveKit room')
      setIsConnected(true)
      setIsLoading(false)

      try { await room.startAudio() } catch (_) {}

      // Scan for video
      const foundVideo = scanForBpTracks(room)
      console.log('[BP] Initial scan found BP video:', foundVideo)
      
      // NEW: Scan for audio
      const foundAudio = scanForAudioTracks(room)
      console.log('[BP] Initial scan found BP audio:', foundAudio)

      // Poll for both video and audio
      if (!foundVideo || !foundAudio) {
        if (pollRef.current) clearInterval(pollRef.current)
        let elapsed = 0
        pollRef.current = setInterval(() => {
          elapsed += 3
          const gotVideo = scanForBpTracks(room)
          const gotAudio = scanForAudioTracks(room)
          console.log(`[BP] Polling for tracks... (${elapsed}s elapsed)`)
          
          if ((gotVideo && gotAudio) || elapsed >= 60) {
            clearInterval(pollRef.current)
            pollRef.current = null
            if (!gotVideo) console.warn('[BP] Video not found after 60s')
            if (!gotAudio) console.warn('[BP] Audio not found after 60s')
          }
        }, 3000)
      }
    })

    // ... rest of existing code ...
    
  }, [showAvatar, attachAudio, handleDataMessage, scanForAudioTracks])

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null }
      // Cleanup audio element
      if (audioRef.current && audioRef.current.parentNode) {
        audioRef.current.parentNode.removeChild(audioRef.current)
      }
    }
  }, [])

  // ... rest of component ...
}
```

---

## 5. Data Flow for Transcript Capture

### 5.1 Transcript Collection Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LIVEKIT DATA CHANNEL FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Beyond Presence Agent                                                │
│         │                                                              │
│         │  STT (Speech-to-Text)                                        │
│         ▼                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Data Channel Message (Binary/JSON)                            │   │
│   │  {                                                              │   │
│   │    type: "transcript",                                        │   │
│   │    transcriptType: "final" | "partial",                        │   │
│   │    role: "user" | "assistant",                                │   │
│   │    transcript: "I have 5 years of experience...",            │   │
│   │    timestamp: 1234567890                                       │   │
│   │  }                                                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│         │                                                              │
│         ▼                                                              │
│   LiveKit Room                                                         │
│         │                                                              │
│         ▼                                                              │
│   BeyondPresenceAvatar.jsx                                             │
│         │  RoomEvent.DataReceived listener                           │
│         ▼                                                              │
│   onTranscriptUpdate() callback                                       │
│         │                                                              │
│         ▼                                                              │
│   aiInterview.jsx                                                      │
│         │  Updates transcripts state array                            │
│         ▼                                                              │
│   HangUpInterview()                                                    │
│         │                                                              │
│         ▼                                                              │
│   POST /api/answers/add                                                │
│         │                                                              │
│         ▼                                                              │
│   answerRoutes.js → getEvaluation() → Cohere                          │
│         │                                                              │
│         ▼                                                              │
│   Results generated and saved to resultModel                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Frontend Transcript State Management

```javascript
// In aiInterview.jsx - Add transcript handling

// State to hold all user answers
const [transcriptHistory, setTranscriptHistory] = useState([])

// Callback from BeyondPresenceAvatar
const handleTranscriptUpdate = useCallback((transcriptData) => {
  if (transcriptData.type === 'final' && transcriptData.role === 'user') {
    // User finished speaking - save to history
    setTranscriptHistory(prev => [...prev, transcriptData.text])
    setCurrentAnswer('') // Clear current answer
  } else if (transcriptData.type === 'partial' && transcriptData.role === 'user') {
    // User is still speaking - update current answer
    setCurrentAnswer(transcriptData.text)
  } else if (transcriptData.role === 'assistant') {
    // AI is speaking - update speaking state
    setAiSpeaking(transcriptData.type === 'partial')
  }
}, [])

// Pass to BeyondPresenceAvatar
<BeyondPresenceAvatar 
  isSpeaking={aiSpeaking}
  showAvatar={avatarEnabled}
  sessionData={bpSessionRef.current}
  onTranscriptUpdate={handleTranscriptUpdate}
  onAiSpeakingChange={setAiSpeaking}
/>
```

---

## 6. Post-Interview Report Flow

### 6.1 Cohere Evaluation Integration

The existing Cohere integration in `answerRoutes.js` handles the evaluation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    POST-INTERVIEW EVALUATION FLOW                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   User clicks "End Interview"                                          │
│         │                                                              │
│         ▼                                                              │
│   hangUpInterview()                                                    │
│         │  Collect transcriptHistory array                             │
│         ▼                                                              │
│   POST /api/answers/add                                                │
│   {                                                                    │
│     interviewId: "xxx",                                               │
│     answers: [                                                         │
│       "I have 5 years of experience in React...",                      │
│       "I would use useMemo for optimization...",                      │
│       ...                                                              │
│     ]                                                                  │
│   }                                                                    │
│         │                                                              │
│         ▼                                                              │
│   answerRoutes.js / POST /add                                          │
│         │                                                              │
│         ▼                                                              │
│   getPrompt(questions, answers)                                        │
│         │  Builds evaluation prompt with matched Q&A                  │
│         ▼                                                              │
│   callCohere(prompt, systemPrompt)                                     │
│         │  Sends to Cohere Command R model                             │
│         ▼                                                              │
│   Cohere Response:                                                     │
│   {                                                                    │
│     score: 75,                                                         │
│     improvements: ["Improve React hooks knowledge", ...],              │
│     overallAssessment: "Good technical foundation..."                 │
│   }                                                                    │
│         │                                                              │
│         ▼                                                              │
│   resultModel.create({                                                 │
│     interviewId,                                                      │
│     score,                                                             │
│     improvements,                                                      │
│     overallAssessment                                                  │
│   })                                                                   │
│         │                                                              │
│         ▼                                                              │
│   Navigate to /postinterview                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Todo List

### Phase 1: Backend Core (Priority: HIGH)
- [ ] **Step 1.1** - Update `backend/.env` with `BP_API_KEYS` comma-separated list
- [ ] **Step 1.2** - Modify `backend/routes/beyondPresenceRoute.js`:
  - [ ] Implement `getBpApiKeys()` function
  - [ ] Implement `bpRequestWithKeyRotation()` with 402/429 handling
  - [ ] Update `ensureAgent()` to accept LLM/TTS config
  - [ ] Update `/create-session` route to accept and pass config
  - [ ] Add `/test-keys` endpoint for debugging

### Phase 2: Frontend Core (Priority: HIGH)
- [ ] **Step 2.1** - Update `frontend/.env` to remove `VITE_VAPI_PUBLIC_KEY`
- [ ] **Step 2.2** - Modify `frontend/src/components/aiInterview.jsx`:
  - [ ] Remove VAPI import and initialization
  - [ ] Remove VAPI event handlers and effects
  - [ ] Remove VAPI start/stop calls
  - [ ] Add transcript state and callback
  - [ ] Update `startInterview()` to pass config to backend
  - [ ] Update `hangUpInterview()` to use transcript array

### Phase 3: Audio Integration (Priority: HIGH)
- [ ] **Step 3.1** - Modify `frontend/src/components/BeyondPresenceAvatar.jsx`:
  - [ ] Add audio track subscription
  - [ ] Implement Data Channel listener for transcripts
  - [ ] Add `onTranscriptUpdate` and `onAiSpeakingChange` callbacks
  - [ ] Handle audio element creation and cleanup

### Phase 4: Testing & Verification (Priority: MEDIUM)
- [ ] **Step 4.1** - Test API key rotation:
  - [ ] Call `POST /api/beyondpresence/test-keys` 
  - [ ] Verify all keys are tested
  - [ ] Simulate 402 error to trigger failover
- [ ] **Step 4.2** - Test interview flow:
  - [ ] Start interview and verify BP connects
  - [ ] Verify audio plays from LiveKit (not VAPI)
  - [ ] Verify video plays from LiveKit
  - [ ] Verify transcripts are captured
  - [ ] End interview and verify results generated

### Phase 5: Cleanup (Priority: LOW)
- [ ] **Step 5.1** - Remove VAPI-related code comments
- [ ] **Step 5.2** - Remove unused VAPI dependencies from package.json
- [ ] **Step 5.3** - Update error messages to reference Beyond Presence instead of VAPI

---

## 8. Testing Checklist

### API Key Rotation Test
```bash
# Test all configured keys
curl -X POST http://localhost:3000/api/beyondpresence/test-keys

# Expected response:
{
  "results": [
    { "keyIndex": 1, "status": 200, "success": true },
    { "keyIndex": 2, "status": 200, "success": true },
    { "keyIndex": 3, "status": 402, "success": false, "error": "..." }
  ]
}
```

### End-to-End Interview Test
1. Start interview session
2. Verify Beyond Presence avatar appears with video
3. Verify AI voice plays through LiveKit audio (not VAPI)
4. Answer questions verbally
5. Verify transcripts captured in state
6. Click "End Interview"
7. Verify results page shows evaluation

---

## 9. Dependencies

### Backend
- No new packages required (uses native `fetch`)

### Frontend
- No new packages required (uses existing `livekit-client`)

### To Remove (after testing)
- `@vapi-ai/web` from `frontend/package.json`

---

## 10. Error Handling

### Backend Error Responses

| Error Code | Description | Action |
|------------|-------------|--------|
| 402 | Payment Required / Out of Credits | Switch to next API key |
| 429 | Too Many Requests | Switch to next API key with backoff |
| 401 | Unauthorized | Log error, don't retry (bad key) |
| 500 | Server Error | Return error to frontend |

### Frontend Error Handling

| Scenario | User Feedback |
|----------|---------------|
| All keys fail | "Interview service unavailable. Please try again later." |
| LiveKit connection fails | "Connection error. Retrying..." then "Failed to connect. Please refresh." |
| Transcript capture fails | Log error, continue interview, use partial answers |

---

## Summary

This plan provides a complete roadmap to:
1. ✅ Remove VAPI completely from the frontend
2. ✅ Implement API key rotation with automatic failover on the backend
3. ✅ Pass LLM/TTS configuration to Beyond Presence
4. ✅ Capture both audio and video from LiveKit
5. ✅ Intercept STT transcripts via Data Channel
6. ✅ Generate post-interview reports using Cohere

The unified architecture eliminates the split-brain latency issues and provides a seamless interview experience with proper lip-sync between the AI avatar's video and voice.
