import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Smile, Frown, Meh, AlertTriangle, CheckCircle, Brain, Camera, CameraOff } from 'lucide-react';

// Model URL - points to public/models directory
const MODEL_URL = '/models';

// Toast notification component
const ToastNotification = ({ message, type }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Brain className="w-5 h-5 text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-500/20 border-green-500/50',
    warning: 'bg-amber-500/20 border-amber-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="text-white text-sm font-medium">{message}</span>
    </motion.div>
  );
};

// Confidence Score Display
const ConfidenceMeter = ({ score }) => {
  const getColor = () => {
    if (score >= 70) return '#10B981'; // green
    if (score >= 40) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Confidence</span>
        <span className="font-semibold text-white">{Math.round(score)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getColor() }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

// Eye Contact Indicator
const EyeContactIndicator = ({ status }) => {
  const config = {
    good: { icon: Eye, label: 'Good Eye Contact', color: 'text-green-400' },
    warning: { icon: EyeOff, label: 'Look at Camera', color: 'text-amber-400' },
    bad: { icon: EyeOff, label: 'Eye Contact Lost', color: 'text-red-400' },
    neutral: { icon: Eye, label: 'Detecting...', color: 'text-gray-400' },
  };

  const { icon: Icon, label, color } = config[status] || config.neutral;

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
};

// Emotion Badge
const EmotionBadge = ({ emotion }) => {
  const config = {
    happy: { icon: Smile, label: 'Happy', color: 'text-green-400 bg-green-500/20' },
    neutral: { icon: Meh, label: 'Neutral', color: 'text-gray-400 bg-gray-500/20' },
    sad: { icon: Frown, label: 'Sad', color: 'text-blue-400 bg-blue-500/20' },
    fearful: { icon: AlertTriangle, label: 'Nervous', color: 'text-amber-400 bg-amber-500/20' },
    angry: { icon: AlertTriangle, label: 'Angry', color: 'text-red-400 bg-red-500/20' },
    disgusted: { icon: Frown, label: 'Disgusted', color: 'text-purple-400 bg-purple-500/20' },
  };

  const { icon: Icon, label, color } = config[emotion] || config.neutral;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
};

// Main Component
export default function BodyLanguageMonitor({ 
  isActive = true, 
  onEyeContactChange,
  onEmotionChange,
  onConfidenceUpdate,
  showLandmarks = false 
}) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const lastToastTime = useRef({});

  // State
  const [hasPermission, setHasPermission] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [eyeContactStatus, setEyeContactStatus] = useState('neutral');
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // Get border color based on status
  const getBorderColor = () => {
    if (eyeContactStatus === 'good' && (currentEmotion === 'happy' || currentEmotion === 'neutral')) {
      return '#10B981'; // green
    }
    if (eyeContactStatus === 'bad' || currentEmotion === 'fearful' || currentEmotion === 'angry') {
      return '#EF4444'; // red
    }
    if (eyeContactStatus === 'warning') {
      return '#F59E0B'; // amber
    }
    return '#007BFF'; // default blue
  };

  // Show toast notification (with throttling)
  const showNotification = useCallback((message, type, key = 'default', cooldown = 3000) => {
    const now = Date.now();
    if (lastToastTime.current[key] && now - lastToastTime.current[key] < cooldown) {
      return;
    }
    lastToastTime.current[key] = now;
    
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  }, []);

  // Calculate eye contact score from landmarks
  const calculateEyeContact = useCallback((landmarks) => {
    try {
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const jaw = landmarks.getJawOutline();
      
      if (!nose || !leftEye || !rightEye || !jaw || jaw.length < 17) {
        return 50;
      }

      // Get face dimensions
      const faceWidth = jaw[16].x - jaw[0].x;
      const faceHeight = jaw[8].y - jaw[0].y;
      
      // Nose tip position relative to face center
      const noseTip = nose[3];
      const faceCenterX = (jaw[0].x + jaw[16].x) / 2;
      const faceCenterY = (jaw[0].y + jaw[8].y) / 2;
      
      const horizontalOffset = Math.abs(noseTip.x - faceCenterX) / (faceWidth / 2);
      const verticalOffset = Math.abs(noseTip.y - faceCenterY) / (faceHeight / 2);
      
      // Calculate eye positions for gaze estimation
      const leftEyeCenter = leftEye.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      leftEyeCenter.x /= leftEye.length;
      leftEyeCenter.y /= leftEye.length;
      
      const rightEyeCenter = rightEye.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      rightEyeCenter.x /= rightEye.length;
      rightEyeCenter.y /= rightEye.length;
      
      // Eye aspect ratio for blink detection (simplified)
      // Using eye distance as a factor
      // const eyeWidth = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
      
      // Score based on looking at camera (nose centered, eyes wide)
      const horizontalScore = Math.max(0, 100 - horizontalOffset * 100);
      const verticalScore = Math.max(0, 100 - verticalOffset * 80);
      
      // Combine scores
      const score = (horizontalScore * 0.6 + verticalScore * 0.4);
      return Math.min(100, Math.max(0, score));
    } catch (err) {
      console.error('Eye contact calculation error:', err);
      return 50;
    }
  }, []);

  // Detect emotion from expressions
  const detectEmotion = useCallback((expressions) => {
    if (!expressions) return 'neutral';
    
    const emotionScores = {
      happy: expressions.happy || 0,
      neutral: expressions.neutral || 0,
      sad: expressions.sad || 0,
      fearful: expressions.fearful || 0,
      angry: expressions.angry || 0,
      disgusted: expressions.disgusted || 0,
      surprised: expressions.surprised || 0,
    };
    
    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxScore = 0;
    
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }
    
    // Only if confidence is above threshold
    return maxScore > 0.5 ? dominantEmotion : 'neutral';
  }, []);

  // Calculate overall confidence score
  const calculateConfidence = useCallback((eyeContactScore, emotion) => {
    let emotionBonus = 0;
    
    switch (emotion) {
      case 'happy':
        emotionBonus = 15;
        break;
      case 'neutral':
        emotionBonus = 5;
        break;
      case 'sad':
        emotionBonus = -10;
        break;
      case 'fearful':
        emotionBonus = -15;
        break;
      case 'angry':
        emotionBonus = -10;
        break;
      default:
        emotionBonus = 0;
    }
    
    const score = (eyeContactScore * 0.7) + emotionBonus + 15;
    return Math.min(100, Math.max(0, score));
  }, []);

  // Draw landmarks on canvas
  const drawLandmarks = useCallback((landmarks, ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw face mesh
    const positions = landmarks.positions;
    
    // Draw dots for each landmark
    ctx.fillStyle = 'rgba(0, 123, 255, 0.7)';
    positions.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, []);

  // Analyze single frame
  const analyzeFrame = useCallback(async () => {
    if (!webcamRef.current || !isInitialized || !isActive) return;
    
    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) return;
    
    try {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detections) {
        const { landmarks, expressions } = detections;
        
        // Calculate metrics
        const eyeContactScore = calculateEyeContact(landmarks);
        const emotion = detectEmotion(expressions);
        const confidence = calculateConfidence(eyeContactScore, emotion);
        
        // Update eye contact status
        let newEyeStatus = 'neutral';
        if (eyeContactScore >= 70) {
          newEyeStatus = 'good';
        } else if (eyeContactScore >= 40) {
          newEyeStatus = 'warning';
        } else {
          newEyeStatus = 'bad';
        }
        
        // Update states
        setEyeContactStatus((prev) => {
          if (prev !== newEyeStatus) {
            if (newEyeStatus === 'good') {
              showNotification('✅ Great Eye Contact!', 'success', 'eyeContact', 2000);
            } else if (newEyeStatus === 'bad') {
              showNotification('⚠️ Maintain Eye Contact', 'warning', 'eyeContact', 3000);
            }
          }
          return newEyeStatus;
        });
        
        setCurrentEmotion((prev) => {
          if (prev !== emotion && emotion === 'happy') {
            showNotification('😊 Great Expression!', 'success', 'emotion', 2000);
          } else if (prev !== emotion && (emotion === 'fearful' || emotion === 'angry')) {
            showNotification('😌 Stay Calm', 'info', 'emotion', 3000);
          }
          return emotion;
        });
        
        setConfidenceScore(confidence);
        
        // Draw landmarks if enabled
        if (showLandmarks && canvasRef.current && landmarks) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          drawLandmarks(landmarks, ctx, canvas.width, canvas.height);
        }
        
        // Callbacks
        onEyeContactChange?.(eyeContactScore);
        onEmotionChange?.(emotion);
        onConfidenceUpdate?.(confidence);
      } else {
        // No face detected - gradual decrease
        setConfidenceScore((prev) => Math.max(0, prev - 2));
        setEyeContactStatus('neutral');
      }
    } catch (err) {
      console.error('Face analysis error:', err);
    }
  }, [isInitialized, isActive, calculateEyeContact, detectEmotion, calculateConfidence, drawLandmarks, showNotification, onEyeContactChange, onEmotionChange, onConfidenceUpdate, showLandmarks]);

  // Initialize models on mount
  useEffect(() => {
    let mounted = true;
    
    const initModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        
        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
          setToastMessage('🧠 Analysis Ready');
          setToastType('success');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2500);
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load face-api models:', err);
          setError('Failed to load AI models. Body language analysis unavailable.');
          setIsLoading(false);
          setToastMessage('⚠️ Analysis Unavailable');
          setToastType('warning');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2500);
        }
      }
    };
    
    initModels();
    
    return () => { mounted = false; };
  }, []);

  // Start/stop analysis loop based on isActive
  useEffect(() => {
    if (isActive && isInitialized) {
      // Run analysis every 200ms
      intervalRef.current = setInterval(analyzeFrame, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isInitialized, analyzeFrame]);

  // Handle camera permission
  const handleUserMedia = () => {
    setHasPermission(true);
  };

  const handleUserMediaError = () => {
    setHasPermission(false);
    setError('Camera access denied. Please enable camera permissions.');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl p-8">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading AI Models...</p>
        <p className="text-gray-500 text-xs mt-2">This may take a moment</p>
      </div>
    );
  }

  // Error state - no permission
  if (hasPermission === false || error) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl p-8">
        <CameraOff className="w-16 h-16 text-gray-500 mb-4" />
        <p className="text-gray-400 text-center font-medium mb-2">
          {error || 'Camera Access Required'}
        </p>
        <p className="text-gray-500 text-xs text-center">
          Please enable camera permissions in your browser settings to use body language analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Webcam Container */}
      <div 
        className="relative w-full h-full rounded-2xl overflow-hidden transition-all duration-500"
        style={{ 
          borderWidth: '4px',
          borderColor: getBorderColor(),
          boxShadow: `0 0 20px ${getBorderColor()}40`
        }}
      >
        {/* Webcam */}
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full object-cover"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user',
          }}
        />
        
        {/* Canvas Overlay for Landmarks */}
        {showLandmarks && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
        
        {/* Glassmorphism Stats Overlay */}
        <div className="absolute top-4 left-4 right-4">
          <div className="backdrop-blur-md bg-gray-900/70 border border-white/10 rounded-xl p-4 space-y-3">
            {/* Confidence Meter */}
            <ConfidenceMeter score={confidenceScore} />
            
            {/* Status Row */}
            <div className="flex items-center justify-between">
              <EyeContactIndicator status={eyeContactStatus} />
              <EmotionBadge emotion={currentEmotion} />
            </div>
          </div>
        </div>
        
        {/* Toast Notifications */}
        <AnimatePresence>
          {showToast && (
            <ToastNotification 
              message={toastMessage} 
              type={toastType}
              onClose={() => setShowToast(false)}
            />
          )}
        </AnimatePresence>
        
        {/* Status Indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive && isInitialized ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-gray-400">
            {isActive && isInitialized ? 'Analyzing' : 'Paused'}
          </span>
        </div>
        
        {/* Camera Icon when active */}
        {isActive && isInitialized && (
          <div className="absolute top-4 right-4">
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-full p-2">
              <Camera className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
