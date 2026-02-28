import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Per-key agent cache. Each BP API key belongs to a separate account, so each
// key needs its own agent_id for correct failover behaviour.
const _agentCache = {};

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
        delete _agentCache[apiKey];
        lastError = new Error(`BP API ${status}: ${errorText}`);
        continue;
      }

      if (status === 401 || status === 403) {
        delete _agentCache[apiKey];
        lastError = new Error(`BP API ${status}: Unauthorized`);
        continue;
      }

      if (status === 404) {
        delete _agentCache[apiKey];
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
 * Return (or create) the managed agent for a specific API key.
 * Cached per-key in _agentCache.
 */
async function ensureAgentForKey(apiKey, config = {}) {
  if (_agentCache[apiKey]) {
    console.log(`[BP] Using cached agent ${_agentCache[apiKey]} for key ${apiKey.substring(0, 8)}...`);
    return _agentCache[apiKey];
  }

  const avatarId = process.env.BEYOND_PRESENCE_AVATAR_ID;
  if (!avatarId) throw new Error('Missing BEYOND_PRESENCE_AVATAR_ID');

  const agentBody = {
    name: 'AI Interviewer',
    avatar_id: avatarId,
    system_prompt: config.systemPrompt ||
      "You are a professional AI technical interviewer. Conduct a structured interview by asking one question at a time about the candidate's skills, experience, and problem-solving ability. Be encouraging, concise, and professional.",
    language: 'en',
    greeting: config.greeting || 'Hello! I am your AI interviewer today. Are you ready to begin?',
    llm: config.llm || { type: 'openai' },
  };

  if (config.tts) agentBody.tts = config.tts;

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
  _agentCache[apiKey] = agent.id;
  console.log(`[BP] Agent ${agent.id} cached for key ${apiKey.substring(0, 8)}...`);
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
    const { llm, tts, greeting, questions, interviewConfig } = req.body || {};

    let systemPrompt = llm?.systemPrompt;

    if (questions?.length && interviewConfig) {
      const n = interviewConfig.noOfQuestions;
      systemPrompt = `You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.

CRITICAL RULE: Ask EXACTLY ${n} questions. NOT ${n + 1}, NOT ${n - 1}. EXACTLY ${n}. Count each question you ask and STOP at ${n}.

You have EXACTLY ${n} questions available. DO NOT create new questions. ONLY use the provided questions below.

Ask one question at a time and wait for the candidate response before proceeding. Keep the questions clear and concise. Below are the ONLY questions you must ask:
Questions: ${questions.join(' ')}

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

    const llmConfig = {
      type: llm?.provider || 'openai',
      ...(llm?.model   && { model: llm.model }),
      ...(systemPrompt && { system_prompt: systemPrompt }),
    };

    const ttsConfig = tts ? {
      provider: tts.provider || 'openai',
      ...(tts.voiceId && { voice_id: tts.voiceId }),
    } : undefined;

    const agentConfig = {
      systemPrompt,
      greeting,
      llm: llmConfig,
      ...(ttsConfig && { tts: ttsConfig }),
    };

    const call = await bpRequestWithKeyRotation(
      '/v1/calls',
      'POST',
      {},
      { requiresAgent: true, agentConfig }
    );

    console.log('[BP] Call created:', call.id, '| livekit_url:', call.livekit_url ? 'present' : 'MISSING');

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