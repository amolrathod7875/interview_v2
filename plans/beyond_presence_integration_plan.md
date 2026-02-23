# Beyond Presence Avatar Integration Plan

## Overview
Replace the current `avatar.glb` 3D model with Beyond Presence SDK for a more realistic AI avatar, while keeping VAPI for audio processing.

## Current System
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   VAPI Audio   │────▶│  aiInterview.jsx │────▶│  AIAvatar3D.jsx │
│   (WebRTC)     │     │  (Orchestrator)  │     │  (GLB Model)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  useAudioAnalyzer│
                        │  (Simulated)     │
                        └──────────────────┘
```

## New System Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│   VAPI Audio    │────▶│  aiInterview.jsx │────▶│ BeyondPresenceAvatar    │
│   (WebRTC)      │     │  (Orchestrator)  │     │ (SDK with auto-lip-sync)│
└─────────────────┘     └──────────────────┘     └─────────────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Beyond Presence  │
                        │ SDK Audio Stream │
                        └──────────────────┘
```

## Implementation Steps

### 1. Environment Configuration
- Add Beyond Presence SDK package to `frontend/package.json`
- Update `frontend/.env` with:
  - `VITE_BEYOND_PRESENCE_API_KEY` - Your API key
  - `VITE_BEYOND_PRESENCE_MODEL_ID` - Your model ID

### 2. Create BeyondPresenceAvatar Component
- Create `frontend/src/components/BeyondPresenceAvatar.jsx`
- Initialize Beyond Presence SDK with credentials
- Configure audio stream handling from VAPI
- Handle loading states and error states

### 3. Update aiInterview.jsx
- Replace `<AIAvatar3D />` with `<BeyondPresenceAvatar />`
- Remove amplitude simulation code (no longer needed)
- Keep VAPI configuration as-is

### 4. Integration Details

#### Beyond Presence SDK Setup (Expected Pattern)
```javascript
import { BeyondPresence } from '@beyondpresence/avatarsdk'

const avatar = new BeyondPresence({
  apiKey: import.meta.env.VITE_BEYOND_PRESENCE_API_KEY,
  modelId: import.meta.env.VITE_BEYOND_PRESENCE_MODEL_ID,
  container: avatarRef.current
})

// Stream VAPI audio to avatar
avatar.on('ready', () => {
  // Connect VAPI audio stream to avatar
})
```

#### VAPI + Beyond Presence Integration
- VAPI handles speech-to-text and text-to-speech
- Audio output from VAPI streams directly to Beyond Presence SDK
- SDK automatically handles lip-sync based on audio input
- No manual amplitude calculation needed

## Files to Modify
1. `frontend/package.json` - Add SDK dependency
2. `frontend/.env` - Add Beyond Presence credentials
3. `frontend/src/components/BeyondPresenceAvatar.jsx` - New component
4. `frontend/src/components/aiInterview.jsx` - Use new avatar component

## Dependencies to Add
- `@beyondpresence/avatarsdk` (or actual package name from Beyond Presence)

## Testing Checklist
- [ ] VAPI connects and starts interview
- [ ] Beyond Presence avatar loads correctly
- [ ] Audio streams from VAPI to avatar
- [ ] Lip-sync works automatically
- [ ] Interview flow completes successfully
- [ ] Error handling works for both services
