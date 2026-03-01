import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ─── Per-key+prompt agent cache ───────────────────────────────────────────────
// Key format: `${apiKey}::${promptHash}`
// Each unique apiKey+systemPrompt combination gets its own cached agent_id.
const _agentCache = {};

/** Simple djb2 hash for cache keys — no crypto dependency needed */
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/**
 * Collect all Beyond Presence API keys from the environment (deduplicated).
 * Supports three formats:
 *   1. BP_API_KEYS=key1,key2,key3   (comma-separated, preferred)
 *   2. BEYOND_PRESENCE_API_KEY      (single legacy key)
 *   3. BEYOND_PRESENCE_API_KEY_1 .. BEYOND_PRESENCE_API_KEY_8
 */
function getBpApiKeys() {
  const keys = [];

  if (process.env.BP_API_KEYS) {
    process.env.BP_API_KEYS.split(',').map(k => k.trim()).filter(Boolean).forEach(k => keys.push(k));
  }

  if (process.env.BEYOND_PRESENCE_API_KEY) {
    keys.push(process.env.BEYOND_PRESENCE_API_KEY);
  }

  for (let i = 1; i <= 8; i++) {
    const k = process.env[`BEYOND_PRESENCE_API_KEY_${i}`];
    if (k) keys.push(k);
  }

  const unique = [...new Set(keys)];
  if (unique.length === 0) throw new Error('No Beyond Presence API keys configured in .env');
  return unique;
}

/**
 * Make a BP API call with automatic key rotation on 402 / 429 errors.
 *
 * @param {string}  endpoint
 * @param {string}  method
 * @param {object}  body
 * @param {object}  options
 * @param {boolean} options.requiresAgent  - automatically inject per-key agent_id
 * @param {object}  options.agentConfig    - config passed to ensureAgentForKey()
 */
async function bpRequestWithKeyRotation(endpoint, method = 'POST', body = null, options = {}) {
  const { requiresAgent = false, agentConfig = {} } = options;
  const keys = getBpApiKeys();
  let lastError = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[attempt];

    try {
      let finalBody = body;

      if (requiresAgent && endpoint === '/v1/calls') {
        const agentId = await ensureAgentForKey(apiKey, agentConfig);
        finalBody = { ...body, agent_id: agentId };
      }

      const fetchOpts = {
        method,
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      };
      if (finalBody) fetchOpts.body = JSON.stringify(finalBody);

      const response = await fetch(`https://api.bey.dev${endpoint}`, fetchOpts);

      if (response.ok) {
        const result = await response.json();
        return { ...result, _apiKeyIndex: attempt };
      }

      const status    = response.status;
      const errorText = await response.text();
      console.warn(`[BP] Key ${attempt + 1}/${keys.length} (${apiKey.substring(0, 8)}...) failed with HTTP ${status}`);

      if (status === 402 || status === 429) {
        // Evict all entries for this key
        Object.keys(_agentCache).filter(k => k.startsWith(apiKey)).forEach(k => delete _agentCache[k]);
        lastError = new Error(`BP API ${status}: ${errorText}`);
        continue;
      }

      if (status === 401 || status === 403) {
        Object.keys(_agentCache).filter(k => k.startsWith(apiKey)).forEach(k => delete _agentCache[k]);
        lastError = new Error(`BP API ${status}: Unauthorized`);
        continue;
      }

      if (status === 404) {
        Object.keys(_agentCache).filter(k => k.startsWith(apiKey)).forEach(k => delete _agentCache[k]);
        lastError = new Error(`BP API 404: Agent not found`);
        continue;
      }

      throw new Error(`BP API ${status}: ${errorText}`);

    } catch (err) {
      console.warn(`[BP] Key ${attempt + 1}/${keys.length} threw: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`All ${keys.length} BP API key(s) failed. Last error: ${lastError?.message}`);
}

/**
 * Return (or create) the managed agent for a specific API key + system prompt.
 * Cached per (apiKey, promptHash) in _agentCache so that:
 *  - The same question set reuses the existing agent (fast, no extra API call)
 *  - A different question set creates a new agent (correct system prompt)
 */
async function ensureAgentForKey(apiKey, config = {}) {
  const promptHash = hashString(config.systemPrompt || '__default__');
  const cacheKey   = `${apiKey}::${promptHash}`;

  if (_agentCache[cacheKey]) {
    console.log(`[BP] Using cached agent ${_agentCache[cacheKey]} for key ${apiKey.substring(0, 8)}... (prompt hash: ${promptHash})`);
    return _agentCache[cacheKey];
  }

  const avatarId = process.env.BEYOND_PRESENCE_AVATAR_ID;
  if (!avatarId) throw new Error('Missing BEYOND_PRESENCE_AVATAR_ID');

  // llm: { type: 'openai' } is required — without it BP's agent is completely
  // silent (no greeting, no responses). This field is not in the TypeScript SDK
  // types but the API accepts it and needs it to activate the LLM pipeline.
  const agentBody = {
    name: 'AI Interviewer',
    avatar_id: avatarId,
    system_prompt: config.systemPrompt ||
      "You are a professional AI technical interviewer. Conduct a structured interview by asking one question at a time about the candidate's skills, experience, and problem-solving ability. Be encouraging, concise, and professional.",
    language: 'en',
    greeting: config.greeting || 'Hello! I am your AI interviewer today. Are you ready to begin?',
    llm: { type: 'openai' },
  };

  console.log(`[BP] Creating agent for key ${apiKey.substring(0, 8)}... with avatar ${avatarId}`);

  const res = await fetch('https://api.bey.dev/v1/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(agentBody),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create agent failed (${res.status}): ${err}`);
  }

  const agent = await res.json();
  _agentCache[cacheKey] = agent.id;
  console.log(`[BP] Agent ${agent.id} cached for key ${apiKey.substring(0, 8)}... (prompt hash: ${promptHash})`);
  return agent.id;
}

/**
 * POST /api/beyondpresence/create-session
 *
 * Body (all optional):
 *   llm             - { provider, model, systemPrompt }
 *   tts             - { provider, voiceId }
 *   greeting        - string
 *   questions       - string[]
 *   interviewConfig - { topic, noOfQuestions, experience }
 *
 * Response:
 *   { success, callId, livekitUrl, clientToken }
 */
router.post('/create-session', async (req, res) => {
  try {
    // Always clear the agent cache on each new interview session.
    // Previously cached agents may have been created with the wrong `llm` field
    // (type:'openai' = text-only ChatGPT, no STT). Clearing forces new agents
    // to be created without that field, restoring BP's default Realtime STT.
    const cleared = Object.keys(_agentCache).length;
    Object.keys(_agentCache).forEach(k => delete _agentCache[k]);
    if (cleared) console.log(`[BP] Cleared ${cleared} cached agent(s) — fresh agents will be created`);

    const { llm, tts, greeting, questions, interviewConfig } = req.body || {};

    let systemPrompt = llm?.systemPrompt;

    if (questions?.length && interviewConfig) {
      const n = interviewConfig.noOfQuestions;
      systemPrompt = `You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.

CRITICAL RULE: Ask EXACTLY ${n} questions. NOT ${n + 1}, NOT ${n - 1}. EXACTLY ${n}. Count each question you ask and STOP at ${n}.

You have EXACTLY ${n} questions available. DO NOT create new questions. ONLY use the provided questions below.

Ask one question at a time and wait for the candidate response before proceeding. Keep the questions clear and concise. Below are the ONLY questions you must ask (in this exact order):
${questions.map((q, i) => `Question ${i + 1}: ${q}`).join('\n')}

If the candidate struggles, offer hints or rephrase the question without giving away the direct answer.

Provide brief 1-2 lined (30-40 worded), encouraging feedback after each answer.

Keep the conversation natural and engaging.

After EXACTLY ${n} questions, IMMEDIATELY wrap up the interview.

After ending with questions, provide feedback based upon user answers, communication skills, and completeness of answers. Rate user overall performance out of 100.

Key Guidelines:
- Be friendly, engaging, and witty
- Keep responses short and natural
- Adapt based on the candidate confidence level
- Take questions from interview from provided questions only
- Never invent your own questions`;
    }

    // Do NOT pass any llm config — BP's AgentCreateParams has no `llm` field.
    // BP's default is OpenAI Realtime (full STT+LLM+TTS voice pipeline).
    const agentConfig = {
      systemPrompt,
      greeting,
    };

    const call = await bpRequestWithKeyRotation(
      '/v1/calls',
      'POST',
      {},
      { requiresAgent: true, agentConfig }
    );

    // Log the actual LiveKit URL so we can verify which project/cluster is used
    let livekitHost = 'MISSING';
    if (call.livekit_url) {
      try { livekitHost = new URL(call.livekit_url).host; } catch { livekitHost = call.livekit_url; }
    }

    // Decode BP's token to log permissions for debugging
    try {
      const p = JSON.parse(Buffer.from(call.livekit_token.split('.')[1], 'base64').toString('utf8'));
      console.log('[BP] Call created:', call.id, '| room:', p?.video?.room,
        '| identity:', p?.sub, '| canPublish:', p?.video?.canPublish,
        '| canSubscribe:', p?.video?.canSubscribe, '| cluster:', livekitHost);
    } catch {
      console.log('[BP] Call created:', call.id, '| livekit_url:', livekitHost);
    }

    // ── Use BP's token as-is ────────────────────────────────────────────────
    // BP's livekit_token is signed for BP's own LiveKit cluster
    // (prod-w0h88kyi.livekit.cloud).  Our LIVEKIT_API_KEY is for a different
    // project.  Signing a token with our key for their domain causes 401.
    // BP already grants canPublish:true in its token so the browser can
    // publish the microphone without any custom token.
    res.json({
      success:     true,
      callId:      call.id,
      livekitUrl:  call.livekit_url,
      clientToken: call.livekit_token,
    });
  } catch (err) {
    console.error('[BP] create-session error:', err);
    res.status(500).json({ error: 'Failed to create session', message: err.message });
  }
});

/**
 * GET /api/beyondpresence/status
 */
router.get('/status', (req, res) => {
  let keyCount = 0;
  try { keyCount = getBpApiKeys().length; } catch (_) {}
  res.json({
    configured:    !!(process.env.BEYOND_PRESENCE_AVATAR_ID && keyCount > 0),
    availableKeys: keyCount,
    cachedAgents:  Object.keys(_agentCache).length,
    // Summarise which (keyPrefix, promptHash) combos are currently cached
    cacheEntries:  Object.keys(_agentCache).map(k => {
      const [keyPrefix, promptHash] = k.split('::');
      return { keyPrefix: keyPrefix.substring(0, 8) + '...', promptHash };
    }),
  });
});

/**
 * POST /api/beyondpresence/test-keys
 * Validates every configured API key with a minimal probe request.
 */
router.post('/test-keys', async (req, res) => {
  let keys = [];
  try { keys = getBpApiKeys(); } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const results = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      const response = await fetch('https://api.bey.dev/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': keys[i] },
        body: JSON.stringify({
          name: 'key-test',
          avatar_id: process.env.BEYOND_PRESENCE_AVATAR_ID || 'test',
        }),
      });
      results.push({
        keyIndex: i + 1,
        status:   response.status,
        success:  response.ok,
        error:    response.ok ? null : await response.text().catch(() => 'Unknown'),
      });
    } catch (err) {
      results.push({ keyIndex: i + 1, status: 'NETWORK_ERROR', success: false, error: err.message });
    }
  }

  res.json({ results });
});

export default router;