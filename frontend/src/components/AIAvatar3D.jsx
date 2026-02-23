import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * GLBAvatar - Realistic 3D avatar with procedural face animations
 * 
 * Features:
 * - Loads GLB model from public/avatar.glb
 * - Lip-sync: Procedural mouth animation based on amplitude
 * - Blink system: Procedural eye animation every 3-5 seconds
 * - Works even without morph targets by manipulating face geometry
 * - Expressions: Smooth transitions between neutral/smile/happy
 * 
 * @param {number} amplitude - Audio amplitude (0-1) for lip-sync
 * @param {string} emotion - 'neutral' | 'smile' | 'happy'
 * @param {boolean} isSpeaking - Whether avatar is speaking
 */
function GLBAvatar({ amplitude = 0, emotion = 'neutral', isSpeaking = false }) {
  const { scene } = useGLTF('/avatar.glb')
  const groupRef = useRef()
  
  // Face parts references for procedural animation
  const eyeLeftRef = useRef()
  const eyeRightRef = useRef()
  const mouthRef = useRef()
  const originalMouthScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const originalEyeScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  
  // Arm/hand references for gesture animation
  const armLeftRef = useRef()
  const armRightRef = useRef()
  const originalArmRotationRef = useRef({ left: null, right: null })
  const handGestureTimeRef = useRef(0)
  
  // Blink state
  const [isBlinking, setIsBlinking] = useState(false)
  const blinkTimerRef = useRef(null)
  
  // Expression values for smooth transitions
  const expressionRef = useRef({ neutral: 1, smile: 0, happy: 0 })
  
  // Smooth amplitude for lip-sync
  const smoothAmplitudeRef = useRef(0)
  
  // Track if we have procedural face parts
  const hasProceduralAnimationRef = useRef(false)

  // Synchronously compute Y offset so head/face is centered at y=0
  const avatarOffsetY = useMemo(() => {
    // Try to find the head mesh by name (ReadyPlayerMe standard)
    let headMesh = null
    scene.traverse((child) => {
      if (child.isMesh && (child.name === 'Wolf3D_Head' || child.name === 'Head' || child.name === 'head')) {
        headMesh = child
      }
    })
    if (headMesh) {
      const box = new THREE.Box3().setFromObject(headMesh)
      const headCenter = new THREE.Vector3()
      box.getCenter(headCenter)
      // Shift down slightly to also show shoulders/chest below the head
      return -headCenter.y + (box.max.y - box.min.y) * 0.2
    }
    // Fallback: use full bounding box, head is at ~90% of height
    const fullBox = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    fullBox.getSize(size)
    return -(fullBox.min.y + size.y * 0.90)
  }, [scene])
  
  // Find face parts (eyes and mouth) in the GLB model
  useEffect(() => {
    const findFaceParts = () => {
      // First, log ALL mesh names to help debug
      const allMeshNames = []
      scene.traverse((child) => {
        if (child.isMesh) {
          allMeshNames.push(child.name)
        }
      })
      console.log('=== All meshes in GLB model ===')
      console.log(allMeshNames)
      console.log('================================')
      
      // Now find face parts
      scene.traverse((child) => {
        // Look for eye meshes - common naming conventions
        const name = child.name?.toLowerCase() || ''
        
        // Find eyes - be more flexible with naming
        if (child.isMesh && (
            name.includes('eye') || 
            name.includes('Eye') ||
            name.includes('pupil') ||
            name.includes('iris')
        ) && !name.includes('brow') && !name.includes('lash')) {
          
          // Try to determine left vs right
          if (name.includes('left') || name.includes('Left') || name.includes('_l') || name.includes('L') || name.includes('2') || name.includes('Left')) {
            if (!eyeLeftRef.current) {
              eyeLeftRef.current = child
              originalEyeScaleRef.current = child.scale.clone()
              console.log('Found LEFT eye:', child.name)
            }
          } else if (name.includes('right') || name.includes('Right') || name.includes('_r') || name.includes('R') || name.includes('3') || name.includes('Right')) {
            if (!eyeRightRef.current) {
              eyeRightRef.current = child
              console.log('Found RIGHT eye:', child.name)
            }
          } else {
            // Single eye or unknown - assign to both
            if (!eyeLeftRef.current) {
              eyeLeftRef.current = child
              originalEyeScaleRef.current = child.scale.clone()
              console.log('Found eye (assigning to left):', child.name)
            }
            if (!eyeRightRef.current) {
              eyeRightRef.current = child
              console.log('Found eye (assigning to right):', child.name)
            }
          }
        }
        
        // Find mouth - try multiple naming conventions
        if (child.isMesh && (
            name.includes('mouth') || 
            name.includes('Mouth') ||
            name.includes('lip') ||
            name.includes('Lip') ||
            name.includes('jaw') ||
            name.includes('Jaw') ||
            name.includes('teeth') ||
            name.includes(' Teeth')
        )) {
          if (!mouthRef.current) {
            mouthRef.current = child
            originalMouthScaleRef.current = child.scale.clone()
            console.log('Found MOUTH:', child.name)
          }
        }
      })
      
      // If we found eyes or mouth, enable procedural animation
      if (eyeLeftRef.current || eyeRightRef.current || mouthRef.current) {
        hasProceduralAnimationRef.current = true
        console.log('=== Face parts found for procedural animation ===')
        console.log('Left Eye:', eyeLeftRef.current?.name || 'NOT FOUND')
        console.log('Right Eye:', eyeRightRef.current?.name || 'NOT FOUND')  
        console.log('Mouth:', mouthRef.current?.name || 'NOT FOUND')
        console.log('=================================================')
      } else {
        console.warn('=== NO face parts found! Check mesh names above ===')
      }
      
      // Find arm bones for hand gestures (skeletal models)
      scene.traverse((child) => {
        if (child.isBone) {
          const name = child.name?.toLowerCase() || ''
          // Look for arm/hand bones
          if (name.includes('arm') || name.includes('hand') || name.includes('elbow') || name.includes('wrist')) {
            if (name.includes('left') || name.includes('_l')) {
              if (!armLeftRef.current) {
                armLeftRef.current = child
                originalArmRotationRef.current.left = child.rotation.clone()
                console.log('Found LEFT ARM bone:', child.name)
              }
            } else if (name.includes('right') || name.includes('_r')) {
              if (!armRightRef.current) {
                armRightRef.current = child
                originalArmRotationRef.current.right = child.rotation.clone()
                console.log('Found RIGHT ARM bone:', child.name)
              }
            }
          }
        }
        // Also check for arm meshes
        if (child.isMesh) {
          const name = child.name?.toLowerCase() || ''
          if ((name.includes('arm') || name.includes('hand')) && !name.includes('eyebrow')) {
            if (name.includes('left') || name.includes('_l')) {
              if (!armLeftRef.current) {
                armLeftRef.current = child
                originalArmRotationRef.current.left = child.rotation ? child.rotation.clone() : new THREE.Euler()
                console.log('Found LEFT ARM mesh:', child.name)
              }
            } else if (name.includes('right') || name.includes('_r')) {
              if (!armRightRef.current) {
                armRightRef.current = child
                originalArmRotationRef.current.right = child.rotation ? child.rotation.clone() : new THREE.Euler()
                console.log('Found RIGHT ARM mesh:', child.name)
              }
            }
          }
        }
      })
      
      if (armLeftRef.current || armRightRef.current) {
        console.log('=== Arm bones found for gestures ===')
        console.log('Left Arm:', armLeftRef.current?.name || 'NOT FOUND')
        console.log('Right Arm:', armRightRef.current?.name || 'NOT FOUND')
        console.log('=====================================')
      }
    }
    
    findFaceParts()
  }, [scene])
  
  // Initialize blink timer - Blink every 3-5 seconds
  useEffect(() => {
    const scheduleNextBlink = () => {
      const baseDelay = 3000 // 3 seconds base
      const randomDelay = Math.random() * 2000 // Random 0-2 seconds extra
      
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => {
          setIsBlinking(false)
          scheduleNextBlink()
        }, 150) // Blink duration
      }, baseDelay + randomDelay)
    }
    
    scheduleNextBlink()
    
    return () => {
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current)
      }
    }
  }, [])
  
  // Expression transitions
  useEffect(() => {
    const targetValues = {
      neutral: emotion === 'neutral' ? 1 : 0,
      smile: emotion === 'smile' ? 1 : 0,
      happy: emotion === 'happy' ? 1 : 0
    }
    
    const interval = setInterval(() => {
      Object.keys(expressionRef.current).forEach(key => {
        expressionRef.current[key] += (targetValues[key] - expressionRef.current[key]) * 0.1
      })
    }, 16)
    
    return () => clearInterval(interval)
  }, [emotion])
  
  // Animation loop
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.elapsedTime
    const expr = expressionRef.current
    
    // Smooth amplitude transition for lip-sync
    smoothAmplitudeRef.current += (amplitude - smoothAmplitudeRef.current) * 0.5
    const smoothAmp = smoothAmplitudeRef.current
    
    // Subtle breathing/idle animation
    groupRef.current.position.y = Math.sin(time * 0.5) * 0.01
    
    // Subtle head movement
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.02
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.01
    
    // === PROCEDURAL BLINKING (Works even without morph targets) ===
    if (hasProceduralAnimationRef.current) {
      const blinkValue = isBlinking ? 0.1 : 1 // Close eyes to 10% scale (squint)
      
      // Animate left eye
      if (eyeLeftRef.current) {
        const origScale = originalEyeScaleRef.current
        eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(
          eyeLeftRef.current.scale.y,
          origScale.y * blinkValue,
          0.3
        )
      }
      
      // Animate right eye
      if (eyeRightRef.current) {
        const origScale = originalEyeScaleRef.current
        eyeRightRef.current.scale.y = THREE.MathUtils.lerp(
          eyeRightRef.current.scale.y,
          origScale.y * blinkValue,
          0.3
        )
      }
      
      // === PROCEDURAL LIP-SYNC (Works even without morph targets) ===
      if (mouthRef.current) {
        const origScale = originalMouthScaleRef.current
        
        // Scale mouth vertically based on amplitude (lip opening)
        const mouthOpen = 1 + smoothAmp * 0.5 // Scale from 1x to 1.5x
        const mouthWiden = 1 + smoothAmp * 0.3 // Slight width increase
        
        mouthRef.current.scale.y = THREE.MathUtils.lerp(
          mouthRef.current.scale.y,
          origScale.y * mouthOpen,
          0.5
        )
        mouthRef.current.scale.x = THREE.MathUtils.lerp(
          mouthRef.current.scale.x,
          origScale.x * mouthWiden,
          0.5
        )
        
        // Optional: Slight mouth movement for more realism
        if (smoothAmp > 0.1) {
          mouthRef.current.position.x = Math.sin(time * 15) * 0.002 * smoothAmp
        }
      }
      
      // === EXPRESSION (smile, happy) ===
      // Apply smile effect by slightly widening the mouth
      if (mouthRef.current && (expr.smile > 0 || expr.happy > 0)) {
        const smileValue = expr.smile * 0.3 + expr.happy * 0.5
        mouthRef.current.scale.x = THREE.MathUtils.lerp(
          mouthRef.current.scale.x,
          originalMouthScaleRef.current.x * (1 + smileValue),
          0.1
        )
      }
    }
    
    // === HAND GESTURE ANIMATION ===
    // Animate arms/hands when speaking
    if (isSpeaking && (armLeftRef.current || armRightRef.current)) {
      handGestureTimeRef.current += 0.016 // ~60fps
      const gestureTime = handGestureTimeRef.current
      
      // Create waving/gesture motion
      const gestureAmplitude = 0.3 // How much the arms move
      const gestureSpeed = 3 // Speed of the gesture
      
      // Left arm gesture
      if (armLeftRef.current && originalArmRotationRef.current.left) {
        const orig = originalArmRotationRef.current.left
        // Subtle waving motion
        const waveX = Math.sin(gestureTime * gestureSpeed) * gestureAmplitude
        const waveZ = Math.sin(gestureTime * gestureSpeed * 0.7) * gestureAmplitude * 0.5
        
        armLeftRef.current.rotation.x = THREE.MathUtils.lerp(
          armLeftRef.current.rotation.x,
          orig.x + waveX,
          0.1
        )
        armLeftRef.current.rotation.z = THREE.MathUtils.lerp(
          armLeftRef.current.rotation.z,
          orig.z + waveZ,
          0.1
        )
      }
      
      // Right arm gesture (slightly different timing for natural look)
      if (armRightRef.current && originalArmRotationRef.current.right) {
        const orig = originalArmRotationRef.current.right
        // Slightly offset wave for natural look
        const waveX = Math.sin(gestureTime * gestureSpeed + 0.5) * gestureAmplitude
        const waveZ = Math.sin(gestureTime * gestureSpeed * 0.7 + 0.3) * gestureAmplitude * 0.5
        
        armRightRef.current.rotation.x = THREE.MathUtils.lerp(
          armRightRef.current.rotation.x,
          orig.x + waveX,
          0.1
        )
        armRightRef.current.rotation.z = THREE.MathUtils.lerp(
          armRightRef.current.rotation.z,
          orig.z + waveZ,
          0.1
        )
      }
    } else {
      // Return arms to rest position when not speaking
      handGestureTimeRef.current = 0
      
      if (armLeftRef.current && originalArmRotationRef.current.left) {
        const orig = originalArmRotationRef.current.left
        armLeftRef.current.rotation.x = THREE.MathUtils.lerp(armLeftRef.current.rotation.x, orig.x, 0.1)
        armLeftRef.current.rotation.z = THREE.MathUtils.lerp(armLeftRef.current.rotation.z, orig.z, 0.1)
      }
      if (armRightRef.current && originalArmRotationRef.current.right) {
        const orig = originalArmRotationRef.current.right
        armRightRef.current.rotation.x = THREE.MathUtils.lerp(armRightRef.current.rotation.x, orig.x, 0.1)
        armRightRef.current.rotation.z = THREE.MathUtils.lerp(armRightRef.current.rotation.z, orig.z, 0.1)
      }
    }
  })
  
  return (
    <group ref={groupRef} scale={1} position={[0, avatarOffsetY, 0]}>
      <primitive object={scene} />
    </group>
  )
}

/**
 * Loading fallback
 */
function AvatarLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#E8C4B8" wireframe />
    </mesh>
  )
}

/**
 * AIAvatar3D - Main 3D avatar component
 * 
 * @param {boolean} isSpeaking - Whether the avatar is currently speaking
 * @param {number} amplitude - Audio amplitude (0-1) for lip-sync
 * @param {string} emotion - 'neutral' | 'smile' | 'happy' - facial expression
 * @param {boolean} showFace - Whether to show the 3D avatar
 */
export default function AIAvatar3D({ 
  isSpeaking = false,
  amplitude = 0,
  emotion = 'neutral',
  showFace = true
}) {
  if (!showFace) {
    return null
  }
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 1.4], fov: 28 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting - Professional Three-point setup */}
        <ambientLight intensity={0.5} />
        
        {/* Key light - main illumination */}
        <spotLight 
          position={[3, 3, 3]} 
          angle={0.4} 
          penumbra={0.8} 
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        
        {/* Fill light - soften shadows */}
        <pointLight position={[-3, 1, 2]} intensity={0.4} color="#ffffff" />
        
        {/* Rim light - back lighting for depth */}
        <pointLight position={[0, 2, -3]} intensity={0.6} color="#007BFF" />
        
        {/* Bottom fill light */}
        <pointLight position={[0, -2, 2]} intensity={0.2} color="#ffffff" />
        
        {/* Environment for realistic reflections */}
        <Environment preset="studio" />
        
        {/* Avatar */}
        <Suspense fallback={<AvatarLoader />}>
          <GLBAvatar 
            amplitude={amplitude}
            emotion={emotion}
            isSpeaking={isSpeaking}
          />
        </Suspense>
        
        {/* Allow user to rotate the avatar */}
        <OrbitControls 
          target={[0, 0, 0]}
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.2}
        />
      </Canvas>
    </div>
  )
}
