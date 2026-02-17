# Audio Generation Fix Plan

## Problem

Currently, when users visit the Audio Overview section, the audio is automatically generated on every visit. This causes:
1. Same audio being created multiple times
2. Unnecessary API calls to the audio generation service
3. User waiting for audio to regenerate even when audio already exists

## Root Cause Analysis

In [`AudioPodcastPlayer.jsx`](frontend/src/components/study/AudioPodcastPlayer.jsx), there's a `useEffect` that auto-generates audio when the component mounts:

```javascript
useEffect(() => {
  if (plainText && plainText.length > 0) {
    generateAudio();
  }
}, [plainText]);
```

This runs every time the user navigates to the Audio Overview tab, regardless of whether audio already exists.

## Solution

### Option A: Track Audio State in Parent Component (Recommended)

1. **Pass audio URL/state from StudyPage to AudioPodcastPlayer**
   - Store the audio URL or existence state in StudyPage's state
   - Pass it down to AudioPodcastPlayer as a prop
   - Only auto-generate if no audio exists

2. **Add audio caching in AudioPodcastPlayer**
   - Check if audio already exists before calling generateAudio
   - Use a ref to track if audio was already generated in this session

### Option B: Disable Auto-Generation Completely

1. **Remove the auto-generation useEffect**
2. **Only show "Generate Audio" button**
3. **User must manually trigger audio generation**

This is simpler but changes the user experience.

## Recommended Approach: Option A

### Implementation Steps

1. **In StudyPage.jsx**:
   - Add state to track if audio has been generated for current session: `const [audioUrl, setAudioUrl] = useState(null);`
   - When generating audio, store the URL: `setAudioUrl(url)`
   - Pass `audioUrl` to AudioPodcastPlayer

2. **In AudioPodcastPlayer.jsx**:
   - Accept `audioUrl` prop
   - Modify the useEffect to only auto-generate if `!audioUrl && !audioExists`
   - When manual "Generate Audio" button is clicked, set audioExists state to true after successful generation

3. **In Backend** (already implemented):
   - The backend caches audio files based on content hash
   - Multiple calls with same text return cached audio
   - This prevents duplicate audio generation costs

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/pages/StudyPage.jsx` | Add audioUrl state, store URL after generation, pass to AudioPodcastPlayer |
| `frontend/src/components/study/AudioPodcastPlayer.jsx` | Accept audioUrl prop, conditionally auto-generate |

## Expected Outcome

- Audio is only generated once per session/study material
- Subsequent visits to Audio Overview show existing audio immediately
- User can still manually regenerate audio if needed
- Backend caching prevents duplicate audio file creation
