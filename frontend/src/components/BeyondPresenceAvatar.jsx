import { useEffect, useRef, useState, useCallback } from 'react'
import { Room, RoomEvent, DataPacket_Kind } from 'livekit-client'

const API = import.meta.env.VITE_API_BASE_URL

// BeyondPresenceAvatar
// Connects to a BP managed-agent LiveKit room.
// Handles: video track, audio track, and Data Channel transcripts.

export default function BeyondPresenceAvatar({
  isSpeaking         = false,
  showAvatar         = true,
  sessionData        = null,
  onTranscriptUpdate = () => {},
  onAiSpeakingChange = () => {},
}) {
  const videoRef   = useRef(null)
  const audioRef   = useRef(null)   // <audio> element for BP voice
  const roomRef    = useRef(null)
  const pollRef    = useRef(null)
  const sessionRef = useRef(sessionData)
  useEffect(() => { sessionRef.current = sessionData }, [sessionData])

  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState(null)
  const [isConnected,   setIsConnected]   = useState(false)
  const [videoAttached, setVideoAttached] = useState(false)
  const [, setAudioAttached] = useState(false)

  // -- Attach BP video track --------------------------------------------------
  const attachVideo = useCallback((track) => {
    const doIt = () => {
      track.attach(videoRef.current)
      setVideoAttached(true)
      console.log('[BP] Avatar video attached')
    }
    if (videoRef.current) {
      doIt()
    } else {
      const t = setInterval(() => { if (videoRef.current) { clearInterval(t); doIt() } }, 50)
    }
  }, [])

  // -- Attach BP audio track --------------------------------------------------
  const attachAudio = useCallback((track) => {
    const doIt = () => {
      // Reuse existing <audio> element or create one
      let audioEl = audioRef.current
      if (!audioEl) {
        audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioEl.playsInline = true
        audioEl.volume = 1.0
        document.body.appendChild(audioEl)
        audioRef.current = audioEl
      }
      track.attach(audioEl)
      setAudioAttached(true)
      console.log('[BP] Avatar audio attached')
    }

    if (document.readyState === 'complete') {
      doIt()
    } else {
      window.addEventListener('load', doIt, { once: true })
    }
  }, [])

  // -- Decode Data Channel messages (STT transcripts) ------------------------
  const handleDataMessage = useCallback((payload, _participant, kind) => {
    // LiveKit v2 uses DataPacket_Kind enum
    const isBinary = kind === DataPacket_Kind.RELIABLE || kind === DataPacket_Kind.LOSSY || kind === 0 || kind === 1
    if (!isBinary) return

    try {
      const text = new TextDecoder().decode(payload)
      const data = JSON.parse(text)

      if (data.type === 'transcript') {
        const transcriptType = data.transcriptType || (data.is_final ? 'final' : 'partial')
        onTranscriptUpdate({
          type:      transcriptType,
          text:      data.transcript || data.text || '',
          role:      data.role || 'user',
          timestamp: Date.now(),
        })
      }

      if (data.type === 'speech_start') {
        onAiSpeakingChange(data.role === 'assistant')
      }

      if (data.type === 'speech_end') {
        onAiSpeakingChange(false)
        onTranscriptUpdate({ type: 'speech_end', role: data.role || 'assistant', text: '' })
      }
    } catch (e) {
      void e // Non-JSON control messages — safe to ignore
    }
  }, [onTranscriptUpdate, onAiSpeakingChange])

  // -- Scan all remote participants for video tracks -------------------------
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

  // -- Scan all remote participants for audio tracks -------------------------
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

  // -- Connect to LiveKit + Beyond Presence ----------------------------------
  const connect = useCallback(async () => {
    if (!showAvatar) return
    if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null }

    try {
      setIsLoading(true)
      setError(null)
      setIsConnected(false)
      setVideoAttached(false)
      setAudioAttached(false)

      let creds = sessionRef.current
      if (!creds) {
        const r = await fetch(`${API}/api/beyondpresence/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `HTTP ${r.status}`)
        creds = await r.json()
      }

      const { clientToken, livekitUrl } = creds
      console.log('[BP] Connecting to LiveKit room...')

      const room = new Room({ adaptiveStream: true, dynacast: true })
      roomRef.current = room

      // Force-subscribe to any published track
      room.on(RoomEvent.TrackPublished, (pub, participant) => {
        console.log(`[BP] Track published by "${participant.identity}": ${pub.kind}`)
        if (!pub.isSubscribed) pub.setSubscribed(true)
      })

      // Attach subscribed tracks
      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        console.log(`[BP] Track subscribed: ${track.kind} from "${participant.identity}"`)
        if (track.kind === 'video') {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          attachVideo(track)
        }
        if (track.kind === 'audio') {
          attachAudio(track)
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === 'video') { track.detach(); setVideoAttached(false) }
        if (track.kind === 'audio') { track.detach(); setAudioAttached(false) }
      })

      // Data Channel: STT transcripts from BP
      room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
        handleDataMessage(payload, participant, kind)
      })

      room.on(RoomEvent.Connected, async () => {
        console.log('[BP] Connected to LiveKit room')
        setIsConnected(true)
        setIsLoading(false)

        try { await room.startAudio() } catch (e) { void e }

        const foundVideo = scanForBpTracks(room)
        const foundAudio = scanForAudioTracks(room)
        console.log('[BP] Initial scan — video:', foundVideo, '| audio:', foundAudio)

        if (!foundVideo || !foundAudio) {
          if (pollRef.current) clearInterval(pollRef.current)
          let elapsed = 0
          pollRef.current = setInterval(() => {
            elapsed += 3
            const gotVideo = scanForBpTracks(room)
            const gotAudio = scanForAudioTracks(room)
            console.log(`[BP] Polling... (${elapsed}s) video=${gotVideo} audio=${gotAudio}`)
            if ((gotVideo && gotAudio) || elapsed >= 60) {
              clearInterval(pollRef.current)
              pollRef.current = null
              if (!gotVideo) console.warn('[BP] Video not found after 60s')
              if (!gotAudio) console.warn('[BP] Audio not found after 60s')
            }
          }, 3000)
        }
      })

      room.on(RoomEvent.ParticipantConnected, participant => {
        console.log('[BP] Participant connected:', participant.identity)
        let attempts = 0
        const tryAttach = () => {
          attempts++
          let foundV = false
          participant.trackPublications.forEach(pub => {
            if (pub.track?.kind === 'video') { foundV = true; attachVideo(pub.track) }
            else if (pub.kind === 'video' && !pub.isSubscribed) pub.setSubscribed(true)
            if (pub.track?.kind === 'audio') attachAudio(pub.track)
            else if (pub.kind === 'audio' && !pub.isSubscribed) pub.setSubscribed(true)
          })
          if (!foundV && attempts < 10) setTimeout(tryAttach, 2000)
        }
        setTimeout(tryAttach, 1000)
      })

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false)
        setVideoAttached(false)
        setAudioAttached(false)
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      })

      room.on(RoomEvent.ConnectionError, err => {
        setError(err.message || 'Connection failed')
        setIsLoading(false)
      })

      await room.connect(livekitUrl, clientToken)
      try { await room.startAudio() } catch (e) { void e }

    } catch (err) {
      console.error('[BP] connect error:', err)
      setError(err.message || 'Failed to connect')
      setIsLoading(false)
    }
  }, [showAvatar, attachVideo, attachAudio, handleDataMessage, scanForBpTracks, scanForAudioTracks])

  // Connect on mount
  useEffect(() => {
    if (showAvatar) connect()
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null }
      // Remove the injected <audio> element
      if (audioRef.current && audioRef.current.parentNode) {
        audioRef.current.parentNode.removeChild(audioRef.current)
        audioRef.current = null
      }
    }
  }, [showAvatar]) // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Avatar video stream */}
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