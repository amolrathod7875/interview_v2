import { useRef, useCallback, useEffect } from 'react'

/**
 * useAudioAnalyzer - Hook for WebAudio API analysis
 * 
 * Provides amplitude data from audio sources for lip-sync applications
 * Uses WebAudio API AnalyserNode for real-time frequency/amplitude analysis
 */
export function useAudioAnalyzer() {
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const sourceRef = useRef(null)
  const smoothedAmplitudeRef = useRef(0)
  const isInitializedRef = useRef(false)

  // Initialize Audio Context and Analyser
  const initAnalyzer = useCallback(() => {
    if (isInitializedRef.current) return

    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()

      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8

      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      isInitializedRef.current = true
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error)
    }
  }, [])

  // Resume audio context (needed after user interaction)
  const resumeContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }, [])

  // Get current amplitude (0-1)
  const getAmplitude = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return 0

    try {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      // Calculate average volume
      let sum = 0
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i]
      }
      const average = sum / dataArrayRef.current.length

      // Normalize to 0-1 range
      const normalized = average / 255

      // Apply smoothing
      smoothedAmplitudeRef.current =
        smoothedAmplitudeRef.current * 0.7 + normalized * 0.3

      return smoothedAmplitudeRef.current
    } catch (error) {
      console.error('Error getting amplitude:', error)
      return 0
    }
  }, [])

  // Get raw frequency data for visualization
  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return null

    try {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      return dataArrayRef.current
    } catch (error) {
      console.error('Error getting frequency data:', error)
      return null
    }
  }, [])

  // Connect to an audio source (MediaStreamSource or AudioElement)
  const connectSource = useCallback((source) => {
    initAnalyzer()

    if (!audioContextRef.current || !analyserRef.current) {
      console.warn('AudioContext not initialized')
      return false
    }

    try {
      // Disconnect previous source if exists
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }

      // Create new source
      sourceRef.current = audioContextRef.current.createMediaElementSource(source)
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)

      return true
    } catch (error) {
      console.error('Error connecting audio source:', error)
      return false
    }
  }, [initAnalyzer])

  // Connect to a MediaStream (e.g., from getUserMedia)
  const connectMediaStream = useCallback((mediaStream) => {
    initAnalyzer()

    if (!audioContextRef.current || !analyserRef.current) {
      console.warn('AudioContext not initialized')
      return false
    }

    try {
      // Disconnect previous source if exists
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }

      // Create new source from media stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream)
      sourceRef.current.connect(analyserRef.current)
      // Don't connect to destination to avoid feedback
      return true
    } catch (error) {
      console.error('Error connecting media stream:', error)
      return false
    }
  }, [initAnalyzer])

  // Simulated amplitude based on speaking state
  // Fallback when actual audio stream is not available
  const getSimulatedAmplitude = useCallback((isSpeaking) => {
    if (isSpeaking) {
      // IMPROVED: Higher and more varied amplitude for visible lip movement
      const base = 0.6 // Increased from 0.4
      const variation = Math.sin(Date.now() / 80) * 0.25 // Faster variation for more natural movement
      const noise = Math.random() * 0.15
      return Math.min(1, base + variation + noise)
    }
    return 0.05
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch {
          // Ignore disconnect errors
        }
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch {
          // Ignore close errors
        }
      }
      isInitializedRef.current = false
    }
  }, [])

  // Helper to check if analyzer is initialized
  const checkIsInitialized = useCallback(() => {
    return isInitializedRef.current
  }, [])

  return {
    getAmplitude,
    getFrequencyData,
    getSimulatedAmplitude,
    connectSource,
    connectMediaStream,
    initAnalyzer,
    resumeContext,
    analyser: analyserRef,
    audioContext: audioContextRef,
    isInitialized: checkIsInitialized
  }
}

export default useAudioAnalyzer
