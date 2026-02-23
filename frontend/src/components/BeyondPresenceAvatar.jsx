import { useEffect, useRef, useState, useCallback } from 'react'
import { Room, RoomEvent } from 'livekit-client'

const API = import.meta.env.VITE_API_BASE_URL

// ─────────────────────────────────────────────────────────────────────────────
// BeyondPresenceAvatar — connects to a BP managed-agent LiveKit room.
// BP creates and owns the room; we receive livekit_url + livekit_token from
// the backend /api/beyondpresence/create-session  →  POST /v1/calls
// ─────────────────────────────────────────────────────────────────────────────

export default function BeyondPresenceAvatar({
  isSpeaking  = false,
  showAvatar  = true,
  sessionData = null,   // pre-warmed { roomName, clientToken, livekitUrl }
}) {
  const videoRef   = useRef(null)
  const roomRef    = useRef(null)
  const pollRef    = useRef(null)   // interval handle for BP track polling
  // Keep sessionData in a ref so changing it doesn't trigger reconnects
  const sessionRef = useRef(sessionData)
  useEffect(() => { sessionRef.current = sessionData }, [sessionData])

  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState(null)
  const [isConnected,   setIsConnected]   = useState(false)
  const [videoAttached, setVideoAttached] = useState(false)

  // ── Attach BP video track to the <video> element ─────────────────────────
  const attachVideo = useCallback((track) => {
    const doIt = () => {
      track.attach(videoRef.current)
      setVideoAttached(true)
      console.log('[BP] ✅ Avatar video attached')
    }
    if (videoRef.current) {
      doIt()
    } else {
      const t = setInterval(() => { if (videoRef.current) { clearInterval(t); doIt() } }, 50)
    }
  }, [])

  // ── Scan all current remote participants for a video track ────────────────
  const scanForBpTracks = useCallback((room) => {
    let found = false
    room.remoteParticipants.forEach(p => {
      p.trackPublications.forEach(pub => {
        if (pub.track?.kind === 'video') {
          found = true
          attachVideo(pub.track)
        } else if (pub.kind === 'video' && !pub.isSubscribed) {
          pub.setSubscribed(true)
        }
      })
    })
    return found
  }, [attachVideo])

  // ── Connect to LiveKit + Beyond Presence ─────────────────────────────────
  const connect = useCallback(async () => {
    if (!showAvatar) return
    // Tear down any previous room cleanly
    if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null }

    try {
      setIsLoading(true)
      setError(null)
      setIsConnected(false)
      setVideoAttached(false)

      // Use pre-warmed session if available, otherwise create one
      let creds = sessionRef.current
      if (!creds) {
        const r = await fetch(`${API}/api/beyondpresence/create-session`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
        })
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `HTTP ${r.status}`)
        creds = await r.json()
      }
      const { roomName, clientToken, livekitUrl } = creds
      console.log('[BP] Connecting to room →', roomName)

      const room = new Room({ adaptiveStream: true, dynacast: true })
      roomRef.current = room

      // ── TrackPublished: force-subscribe (in case autoSubscribe is off) ────
      room.on(RoomEvent.TrackPublished, (pub, participant) => {
        console.log(`[BP] Track published by "${participant.identity}": ${pub.kind}`)
        if (!pub.isSubscribed) {
          pub.setSubscribed(true)
          console.log(`[BP] Force-subscribed to ${pub.kind}`)
        }
      })

      // ── TrackSubscribed: attach video ─────────────────────────────────────
      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        console.log(`[BP] ✅ Track subscribed: ${track.kind} from "${participant.identity}"`)
        if (track.kind === 'video') {
          // Stop the poll — we found the video
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          attachVideo(track)
        }
        // BP's own audio is intentionally ignored — VAPI handles voice
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === 'video') { track.detach(); setVideoAttached(false) }
      })

      // ── Connected: BP managed agent is already in the room — just scan + poll ──
      room.on(RoomEvent.Connected, async () => {
        console.log('[BP] ✅ Connected to LiveKit room (BP managed agent)')
        setIsConnected(true)
        setIsLoading(false)

        // Unblock autoplay — required by Chrome/Safari
        try { await room.startAudio() } catch (_) {}

        // Scan immediately — BP agent may already be publishing
        const found = scanForBpTracks(room)
        console.log('[BP] Initial scan found BP video:', found)

        // Poll every 3s up to 60s for BP agent to start publishing video
        if (!found) {
          if (pollRef.current) clearInterval(pollRef.current)
          let elapsed = 0
          pollRef.current = setInterval(() => {
            elapsed += 3
            console.log(`[BP] Polling for avatar... (${elapsed}s elapsed)`)
            const gotIt = scanForBpTracks(room)
            if (gotIt || elapsed >= 60) {
              clearInterval(pollRef.current)
              pollRef.current = null
              if (!gotIt) console.warn('[BP] Avatar not found after 60s')
            }
          }, 3000)
        }
      })

      // ── BP participant joins after us ──────────────────────────────────────
      room.on(RoomEvent.ParticipantConnected, participant => {
        console.log('[BP] Participant connected:', participant.identity)
        // Give BP a moment to publish tracks, then scan (retry up to 5 times)
        let attempts = 0
        const tryAttach = () => {
          attempts++
          let found = false
          participant.trackPublications.forEach(pub => {
            console.log(`[BP] ${participant.identity} track: ${pub.kind} subscribed=${pub.isSubscribed} hasTrack=${!!pub.track}`)
            if (pub.track?.kind === 'video') { found = true; attachVideo(pub.track) }
            else if (pub.kind === 'video' && !pub.isSubscribed) pub.setSubscribed(true)
          })
          if (!found && attempts < 10) setTimeout(tryAttach, 2000)
        }
        setTimeout(tryAttach, 1000)
      })

      room.on(RoomEvent.Disconnected,    () => {
        setIsConnected(false); setVideoAttached(false)
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      })
      room.on(RoomEvent.ConnectionError, err => { setError(err.message || 'Connection failed'); setIsLoading(false) })

      await room.connect(livekitUrl, clientToken)

      // Unblock media autoplay (required by Chrome/Safari after connect)
      try { await room.startAudio() } catch (_) {}

    } catch (err) {
      console.error('[BP] connect error:', err)
      setError(err.message || 'Failed to connect')
      setIsLoading(false)
    }
  }, [showAvatar, attachVideo, scanForBpTracks])  // sessionData intentionally NOT a dep — use sessionRef

  // Connect once on mount, not on every prop change
  useEffect(() => {
    if (showAvatar) connect()
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null }
    }
  }, [showAvatar])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!showAvatar) return null

  return (
    <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative">

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Connecting to interviewer...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-2xl font-bold">!</span>
            </div>
            <p className="text-red-400 text-sm font-medium">Avatar Connection Failed</p>
            <p className="text-gray-500 text-xs">{error}</p>
            <button onClick={connect} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Avatar video stream from Beyond Presence */}
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      {/* Placeholder while waiting for first video frame */}
      {isConnected && !videoAttached && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Interviewer joining...</p>
            <p className="text-gray-600 text-xs mt-1">Avatar will appear once the session starts</p>
          </div>
        </div>
      )}

      {/* Live / Speaking pill */}
      {isConnected && !isLoading && (
        <div className={`absolute bottom-3 right-3 flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 ${
          isSpeaking ? 'bg-blue-600/80' : 'bg-black/60'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isSpeaking ? 'bg-white' : 'bg-green-400'}`} />
          <span className="text-xs text-white font-medium">{isSpeaking ? 'Speaking' : 'Live'}</span>
        </div>
      )}

    </div>
  )
}
