import { useEffect, useRef, useState, useCallback } from 'react'
import { Room, RoomEvent, Track, createLocalAudioTrack } from 'livekit-client'

const API = import.meta.env.VITE_API_BASE_URL

/**
 * BeyondPresenceAvatar
 *
 * Connects to a LiveKit room that has a Beyond Presence agent already running.
 * Publishes the user's microphone so the AI can hear them (STT pipeline).
 *
 * Props:
 *   sessionData         - { callId, livekitUrl, clientToken } from backend
 *   isSpeaking          - boolean (from parent, drives the speaking pill UI)
 *   showAvatar          - boolean (unmount/remount toggle)
 *   preobtainedMicStream- MediaStream obtained during user-gesture (button click)
 *                         in the parent.  Passing it here bypasses the browser
 *                         permission prompt that would otherwise occur outside a
 *                         user-gesture context.
 *   onTranscriptUpdate  - (transcriptData) => void
 *   onAiSpeakingChange  - (boolean) => void
 */
export default function BeyondPresenceAvatar({
  isSpeaking            = false,
  showAvatar            = true,
  sessionData           = null,
  onTranscriptUpdate    = () => {},
  onAiSpeakingChange    = () => {},
}) {
  const videoRef    = useRef(null)
  const audioRef    = useRef(null)   // DOM <audio> fallback
  const audioCtxRef = useRef(null)   // Web Audio context for AI voice playback
  const roomRef     = useRef(null)
  const pollRef     = useRef(null)
  const sessionRef  = useRef(sessionData)

  // keep ref in sync with prop
  useEffect(() => { sessionRef.current = sessionData }, [sessionData])

  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState(null)
  const [isConnected,   setIsConnected]   = useState(false)
  const [videoAttached, setVideoAttached] = useState(false)
  const [micLevel,      setMicLevel]      = useState(0)
  const [micWarning,    setMicWarning]    = useState(false)
  const micTimerRef = useRef(null)

  // ── Attach BP video track ──────────────────────────────────────────────────
  const attachVideo = useCallback((track) => {
    const doAttach = () => {
      if (!videoRef.current) return
      track.attach(videoRef.current)
      setVideoAttached(true)
      console.log('[BP] ✅ Avatar video attached')
    }
    if (videoRef.current) doAttach()
    else {
      const t = setInterval(() => { if (videoRef.current) { clearInterval(t); doAttach() } }, 50)
    }
  }, [])

  // ── Attach BP audio track (AI voice) via Web Audio API ───────────────────
  // CRITICAL: Using track.attach(domAudioElement) causes Chrome to classify
  // the WebRTC playback as a "communications" channel, which triggers the
  // OS-level AEC and silences the mic even with echoCancellation:false in
  // getUserMedia. Routing through AudioContext.destination avoids this
  // classification entirely and lets the mic pass cleanly to BP's STT.
  const attachAudio = useCallback((track) => {
    try {
      // Close any prior context (avoid multiple contexts on reconnect)
      if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}) }
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctx.resume()
      const ms  = new MediaStream([track.mediaStreamTrack])
      const src = ctx.createMediaStreamSource(ms)
      src.connect(ctx.destination)
      audioCtxRef.current = ctx
      console.log('[BP] ✅ Avatar audio (AI voice) attached via Web Audio')
    } catch (e) {
      console.warn('[BP] Web Audio attach failed, falling back to <audio>:', e.message)
      let el = audioRef.current
      if (!el) {
        el = document.createElement('audio')
        el.autoplay    = true
        el.playsInline = true
        el.volume      = 1.0
        document.body.appendChild(el)
        audioRef.current = el
      }
      track.attach(el)
      console.log('[BP] ✅ Avatar audio (AI voice) attached via DOM element')
    }
  }, [])

  // ── Handle Data Channel messages (STT transcripts from BP) ────────────────
  const handleDataMessage = useCallback((payload) => {
    try {
      const raw  = new TextDecoder().decode(payload)
      const data = JSON.parse(raw)

      // ── RAW LOG — helps identify what BP actually sends ──────────────────
      console.log('[BP] DataReceived raw:', raw)

      // ── BP flat format: {id, message, timestamp, sender?} ─────────────────
      // This is the primary format BP uses during live calls.
      // sender: 'ai'   → avatar speaking (assistant)
      // sender: 'user' → user speech transcript
      // no sender      → greeting / AI message
      if (data.message && !data.type) {
        const role = data.sender === 'user' ? 'user'
                   : data.sender === 'ai'   ? 'assistant'
                   : 'assistant'
        onTranscriptUpdate({ type: 'final', text: data.message, role, timestamp: data.timestamp || Date.now() })
        if (role === 'assistant') onAiSpeakingChange(true)
        return
      }

      // ── Typed transcript events (fallback for other BP event shapes) ──────
      if (
        data.type === 'transcript'       ||
        data.type === 'transcription'    ||
        data.type === 'user_message'     ||
        data.type === 'agent_message'    ||
        (data.role && (data.text || data.transcript))
      ) {
        const isFinal = data.is_final ?? data.final ?? (data.transcriptType === 'final')
        const tType   = isFinal ? 'final' : 'partial'
        const role    = data.role
                          || (data.type === 'user_message'  ? 'user'      : undefined)
                          || (data.type === 'agent_message' ? 'assistant' : undefined)
                          || 'user'
        const text    = data.transcript || data.text || ''
        if (text) {
          onTranscriptUpdate({ type: tType, text, role, timestamp: Date.now() })
        }
      }

      if (data.type === 'speech_start') {
        onAiSpeakingChange(data.role === 'assistant')
      }

      if (data.type === 'speech_end') {
        onAiSpeakingChange(false)
        onTranscriptUpdate({ type: 'speech_end', role: data.role || 'assistant', text: '' })
      }
    } catch { /* non-JSON control messages — safe to ignore */ }
  }, [onTranscriptUpdate, onAiSpeakingChange])

  // ── Scan participants for video/audio tracks ───────────────────────────────
  const scanTracks = useCallback((room) => {
    let foundVideo = false, foundAudio = false
    room.remoteParticipants.forEach(p => {
      p.trackPublications.forEach(pub => {
        if (!pub.isSubscribed) pub.setSubscribed(true)
        if (pub.track?.kind === Track.Kind.Video) { foundVideo = true; attachVideo(pub.track) }
        if (pub.track?.kind === Track.Kind.Audio) { foundAudio = true; attachAudio(pub.track) }
      })
    })
    return { foundVideo, foundAudio }
  }, [attachVideo, attachAudio])

  // ── Mic level meter ────────────────────────────────────────────────────────
  // Accepts the raw MediaStreamTrack from createLocalAudioTrack — this is the
  // pre-encoded getUserMedia track so AudioContext reads accurate PCM levels.
  const setupMicMeter = (rawTrack) => {
    if (micTimerRef.current) { clearInterval(micTimerRef.current); micTimerRef.current = null }
    try {
      const ctx      = new AudioContext()
      ctx.resume()
      const src      = ctx.createMediaStreamSource(new MediaStream([rawTrack]))
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser) // analyser only — NOT wired to destination/output
      const buf = new Uint8Array(analyser.frequencyBinCount)
      let silent = 0
      micTimerRef.current = setInterval(() => {
        analyser.getByteFrequencyData(buf)
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length
        const pct = Math.min(100, Math.round(avg * 3))
        setMicLevel(pct)
        if (pct < 2) { silent++; if (silent > 80) setMicWarning(true) }  // 8s grace period
        else          { silent = 0; setMicWarning(false) }
      }, 100)
    } catch (e) {
      console.warn('[BP] Mic meter unavailable:', e.message)
    }
  }

  // ── Main connect function ──────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!showAvatar) return
    if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null }

    setIsLoading(true)
    setError(null)
    setIsConnected(false)
    setVideoAttached(false)

    try {
      // Get session credentials
      let creds = sessionRef.current
      if (!creds?.clientToken || !creds?.livekitUrl) {
        console.log('[BP] No pre-created session, calling create-session...')
        const r = await fetch(`${API}/api/beyondpresence/create-session`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body.message || `Session create failed: HTTP ${r.status}`)
        }
        creds = await r.json()
      }

      const { clientToken, livekitUrl } = creds
      if (!clientToken || !livekitUrl) throw new Error('Missing LiveKit credentials')

      // Decode token for debug
      try {
        const p = JSON.parse(atob(clientToken.split('.')[1]))
        console.log('[BP] Token — identity:', p.sub, '| room:', p.video?.room,
          '| canPublish:', p.video?.canPublish, '| canSubscribe:', p.video?.canSubscribe)
      } catch { /* ignore */ }

      // ── Create Room — PLAIN config, matching BP's official demo exactly ──
      // Do NOT override publishDefaults (no dtx:false, no codec changes).
      // BP's server-side STT expects vanilla Opus audio as LiveKit publishes it.
      const room = new Room({
        adaptiveStream: true,
        dynacast:       true,
      })
      roomRef.current = room

      // Force-subscribe to every remote track as it's published
      room.on(RoomEvent.TrackPublished, (pub) => {
        if (!pub.isSubscribed) pub.setSubscribed(true)
      })

      // Confirm our mic track is visible to the room (server ack)
      room.on(RoomEvent.LocalTrackPublished, (pub) => {
        console.log('[BP] LocalTrackPublished — source:', pub.source, '| sid:', pub.trackSid, '| muted:', pub.isMuted)
      })

      // KEY DEBUG: tells us if BP's agent actually subscribes to our mic.
      // If this never fires for source=microphone, BP is NOT processing our audio.
      room.on(RoomEvent.LocalTrackSubscribed, (pub, participant) => {
        console.log('[BP] ⭐ LocalTrackSubscribed —', participant.identity, 'subscribed to our', pub.source, '| sid:', pub.trackSid)
      })

      // Attach avatar video/audio as tracks arrive
      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        console.log(`[BP] Track subscribed: ${track.kind} from "${participant.identity}"`)
        if (track.kind === Track.Kind.Video) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          attachVideo(track)
        }
        if (track.kind === Track.Kind.Audio) attachAudio(track)
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach()
        if (track.kind === Track.Kind.Video) setVideoAttached(false)
      })

      // Data channel: STT transcripts from BP
      room.on(RoomEvent.DataReceived, (payload) => handleDataMessage(payload))

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('[BP] Participant connected:', participant.identity)
        setTimeout(() => {
          participant.trackPublications.forEach(pub => {
            if (!pub.isSubscribed) pub.setSubscribed(true)
            if (pub.track?.kind === Track.Kind.Video) attachVideo(pub.track)
            if (pub.track?.kind === Track.Kind.Audio) attachAudio(pub.track)
          })
        }, 500)
      })

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false)
        setVideoAttached(false)
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        console.log('[BP] Room disconnected')
      })

      room.on(RoomEvent.ConnectionError, (err) => {
        setError(err.message || 'Connection failed')
        setIsLoading(false)
      })

      // ── Connect (awaited fully, exactly like official BP demo) ────────────
      console.log('[BP] Connecting to:', new URL(livekitUrl).host)
      await room.connect(livekitUrl, clientToken)
      console.log('[BP] ✅ Connected')

      const perms = room.localParticipant.permissions
      console.log('[BP] Permissions — canPublish:', perms?.canPublish, '| canSubscribe:', perms?.canSubscribe)

      setIsConnected(true)
      setIsLoading(false)

      // ── Publish microphone via createLocalAudioTrack (AEC fully disabled) ─
      // We bypass setMicrophoneEnabled() because it routes through LiveKit's
      // internal mic manager which may reapply processing. createLocalAudioTrack
      // gives direct control over getUserMedia constraints.
      // AEC is disabled because the browser's AEC (and the OS-level AEC triggered
      // by WebRTC audio output) silences the mic while AI speaks. BP / OpenAI
      // Realtime handles echo suppression server-side.
      console.log('[BP] Creating mic track (AEC off)...')
      const micTrack = await createLocalAudioTrack({
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl:  false,
      })
      // Belt-and-suspenders: apply constraints at the native MediaStreamTrack level too
      try {
        await micTrack.mediaStreamTrack.applyConstraints({
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl:  false,
        })
      } catch { /* applyConstraints is best-effort */ }

      await room.localParticipant.publishTrack(micTrack)
      const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone)
      console.log('[BP] ✅ Mic published — sid:', micPub?.trackSid,
        '| track:', micTrack.mediaStreamTrack.label,
        '| readyState:', micTrack.mediaStreamTrack.readyState)

      // Start audio playback (unblocks autoplay in Chrome/Safari)
      try { await room.startAudio() } catch { /* ignore — not critical */ }

      // Use the raw track from createLocalAudioTrack for the meter —
      // it is the unencoded getUserMedia stream so AudioContext reads it accurately.
      setupMicMeter(micTrack.mediaStreamTrack)

      // ── Poll for avatar tracks ────────────────────────────────────────────
      const { foundVideo, foundAudio } = scanTracks(room)
      console.log('[BP] Initial track scan — video:', foundVideo, '| audio:', foundAudio)
      if (!foundVideo || !foundAudio) {
        let elapsed = 0
        pollRef.current = setInterval(() => {
          elapsed += 3
          const { foundVideo: v, foundAudio: a } = scanTracks(room)
          console.log(`[BP] Polling (${elapsed}s) video:${v} audio:${a}`)
          if ((v && a) || elapsed >= 60) {
            clearInterval(pollRef.current); pollRef.current = null
          }
        }, 3000)
      }

    } catch (err) {
      console.error('[BP] connect() error:', err)
      setError(err.message || 'Failed to connect')
      setIsLoading(false)
    }
  }, [showAvatar, attachVideo, attachAudio, handleDataMessage, scanTracks])

  // ── Connect on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (showAvatar) connect()

    return () => {
      if (micTimerRef.current)  { clearInterval(micTimerRef.current);  micTimerRef.current  = null }
      if (pollRef.current)      { clearInterval(pollRef.current);      pollRef.current      = null }
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
      if (audioRef.current?.parentNode) {
        audioRef.current.parentNode.removeChild(audioRef.current)
        audioRef.current = null
      }
    }
  }, [showAvatar]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!showAvatar) return null

  return (
    <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative">

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Connecting to interviewer...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-2xl font-bold">!</span>
            </div>
            <p className="text-red-400 text-sm font-medium">Connection Failed</p>
            <p className="text-gray-500 text-xs">{error}</p>
            <button onClick={connect} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Avatar video stream */}
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      {/* Waiting for video placeholder */}
      {isConnected && !videoAttached && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Interviewer joining...</p>
          </div>
        </div>
      )}

      {/* Live / Speaking indicator */}
      {isConnected && !isLoading && (
        <div className={`absolute bottom-3 right-3 flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 ${
          isSpeaking ? 'bg-blue-600/80' : 'bg-black/60'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isSpeaking ? 'bg-white' : 'bg-green-400'}`} />
          <span className="text-xs text-white font-medium">{isSpeaking ? 'Speaking' : 'Live'}</span>
        </div>
      )}

      {/* Mic level meter */}
      {isConnected && !isLoading && (
        <div className="absolute bottom-3 left-3 flex flex-col gap-1" style={{ width: 90 }}>
          <div className="flex items-center gap-1">
            <svg className={`w-3 h-3 flex-shrink-0 ${micWarning ? 'text-red-400' : 'text-green-400'}`}
              fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd" />
            </svg>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  micWarning ? 'bg-red-500' : micLevel > 20 ? 'bg-green-400' : 'bg-yellow-400'
                }`}
                style={{ width: `${micLevel}%` }}
              />
            </div>
          </div>
          {micWarning && (
            <p className="text-red-400 text-center" style={{ fontSize: 9, lineHeight: 1.3 }}>
              No mic detected.<br />Check browser permissions.
            </p>
          )}
        </div>
      )}

    </div>
  )
}
