import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Cached agent_id — set from env (BEYOND_PRESENCE_AGENT_ID) or auto-created on first call
let _cachedAgentId = process.env.BEYOND_PRESENCE_AGENT_ID || null;

/**
 * Ensure a BP managed agent exists.
 * Uses BEYOND_PRESENCE_AGENT_ID env var if set.
 * Otherwise creates an agent via POST /v1/agents (once) and caches the id.
 */
async function ensureAgent() {
  if (_cachedAgentId) return _cachedAgentId;

  const avatarId = process.env.BEYOND_PRESENCE_AVATAR_ID;
  const apiKey   = process.env.BEYOND_PRESENCE_API_KEY;
  if (!avatarId || !apiKey) throw new Error('Missing BEYOND_PRESENCE_AVATAR_ID or BEYOND_PRESENCE_API_KEY');

  console.log('[BP] Auto-creating managed agent with avatar_id:', avatarId);

  const res = await fetch('https://api.bey.dev/v1/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      name: 'AI Interviewer',
      avatar_id: avatarId,
      system_prompt:
        'You are a professional AI technical interviewer. Conduct a structured interview by asking one question at a time about the candidate\'s skills, experience, and problem-solving ability. Be encouraging, concise, and professional.',
      language: 'en',
      greeting: 'Hello! I am your AI interviewer today. Are you ready to begin?',
      llm: { type: 'openai' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Create agent failed: ' + res.status + ' ' + err);
  }

  const agent = await res.json();
  _cachedAgentId = agent.id;
  console.log('[BP] Managed agent created and cached:', _cachedAgentId);
  return _cachedAgentId;
}

/**
 * POST /api/beyondpresence/create-session
 * 1. Ensures a managed agent exists (creates one if needed)
 * 2. Creates a call via POST /v1/calls
 * 3. Returns livekit_url + livekit_token for the frontend to connect with
 *    — BP's avatar agent is already waiting in the room.
 */
router.post('/create-session', async (req, res) => {
  try {
    const apiKey = process.env.BEYOND_PRESENCE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing BEYOND_PRESENCE_API_KEY' });

    const agentId = await ensureAgent();
    console.log('[BP] Creating call with agent_id:', agentId);

    const bpRes = await fetch('https://api.bey.dev/v1/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ agent_id: agentId }),
    });

    if (!bpRes.ok) {
      const errText = await bpRes.text();
      throw new Error('BP API ' + bpRes.status + ': ' + errText);
    }

    const call = await bpRes.json();
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
  res.json({
    configured: !!(process.env.BEYOND_PRESENCE_API_KEY &&
      (process.env.BEYOND_PRESENCE_AGENT_ID || process.env.BEYOND_PRESENCE_AVATAR_ID)),
    cachedAgentId: _cachedAgentId || 'not created yet',
  });
});

export default router;