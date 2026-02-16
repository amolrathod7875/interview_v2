import { useEffect, useRef, useState } from 'react'

export default function AIAvatarSphere({ status = 'active', type = 'ai' }) {
    const canvasRef = useRef(null)
    const animationFrameRef = useRef(null)
    const particlesRef = useRef([])
    const rotationRef = useRef(0)
    const breathingRef = useRef(0)

    // Color schemes based on type - Professional Corporate Blue Theme
    const colorSchemes = {
        ai: {
            shades: [
                '#007BFF', // Electric Blue
                '#0056D2', // Deep Blue
                '#1A2B4B', // Navy
                '#0069E0', // Bright Blue
                '#003D99', // Dark Blue
                '#0084FF', // Light Blue
            ],
            shadowColor: '#007BFF'
        },
        user: {
            shades: [
                '#007BFF', // Electric Blue (same as AI for consistency)
                '#0056D2', // Deep Blue
                '#1A2B4B', // Navy
                '#0069E0', // Bright Blue
                '#003D99', // Dark Blue
                '#0084FF', // Light Blue
            ],
            shadowColor: '#007BFF'
        }
    }

    const colors = colorSchemes[type] || colorSchemes.ai

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height

        // Create particles forming a sphere
        const initParticles = () => {
            const particles = []
            const numParticles = 800
            const radius = 120

            // Blue color variations for techy feel
            const blueShades = colors.shades

            for (let i = 0; i < numParticles; i++) {
                // Fibonacci sphere distribution for even particle placement
                const phi = Math.acos(1 - 2 * (i + 0.5) / numParticles)
                const theta = Math.PI * (1 + Math.sqrt(5)) * i

                const x = radius * Math.sin(phi) * Math.cos(theta)
                const y = radius * Math.sin(phi) * Math.sin(theta)
                const z = radius * Math.cos(phi)

                particles.push({
                    x,
                    y,
                    z,
                    originalZ: z,
                    color: blueShades[Math.floor(Math.random() * blueShades.length)],
                    baseOpacity: 0.3 + Math.random() * 0.7, // Varying opacity for depth
                    size: 1.5 + Math.random() * 1.5,
                    flickerSpeed: 0.5 + Math.random() * 1.5, // Random flicker speed for each particle
                    flickerOffset: Math.random() * Math.PI * 2, // Random starting phase
                })
            }

            return particles
        }

        particlesRef.current = initParticles()

        // Animation loop
        const animate = () => {
            // Clear canvas with white/transparent background
            ctx.clearRect(0, 0, width, height)

            // Update rotation and breathing
            rotationRef.current += 0.005 // Smooth rotation speed
            breathingRef.current += 0.02

            // Breathing effect (scale oscillation)
            const breathingScale = 1 + Math.sin(breathingRef.current) * 0.08

            // Sort particles by z-depth for proper rendering
            const sortedParticles = [...particlesRef.current].sort((a, b) => {
                // Rotate particles
                const aRotatedZ = a.z * Math.cos(rotationRef.current) - a.x * Math.sin(rotationRef.current)
                const bRotatedZ = b.z * Math.cos(rotationRef.current) - b.x * Math.sin(rotationRef.current)
                return aRotatedZ - bRotatedZ
            })

            // Render particles
            sortedParticles.forEach(particle => {
                // Apply Y-axis rotation
                const rotatedX = particle.x * Math.cos(rotationRef.current) + particle.z * Math.sin(rotationRef.current)
                const rotatedZ = particle.z * Math.cos(rotationRef.current) - particle.x * Math.sin(rotationRef.current)
                const rotatedY = particle.y

                // Apply breathing scale
                const scaledX = rotatedX * breathingScale
                const scaledY = rotatedY * breathingScale
                const scaledZ = rotatedZ * breathingScale

                // 3D to 2D projection
                const perspective = 400
                const scale = perspective / (perspective + scaledZ)
                const projectedX = scaledX * scale + width / 2
                const projectedY = scaledY * scale + height / 2

                // Calculate opacity based on depth (z-position)
                const depthOpacity = (scaledZ + 150) / 300 // Normalize z to 0-1 range
                let finalOpacity = particle.baseOpacity * Math.max(0.2, Math.min(1, depthOpacity))

                // Add flickering effect when status is active
                if (status === 'active') {
                    const flickerValue = Math.sin(breathingRef.current * particle.flickerSpeed + particle.flickerOffset)
                    const flickerIntensity = 0.4 + (flickerValue * 0.6) // Flicker between 0.4 and 1.0
                    finalOpacity *= flickerIntensity
                }

                // Draw particle
                ctx.beginPath()
                ctx.arc(projectedX, projectedY, particle.size * scale, 0, Math.PI * 2)
                ctx.fillStyle = particle.color + Math.floor(finalOpacity * 255).toString(16).padStart(2, '0')
                ctx.fill()

                // Add subtle glow for front particles when active
                if (status === 'active' && scaledZ > 50) {
                    ctx.shadowBlur = 10 + Math.random() * 5
                    ctx.shadowColor = colors.shadowColor
                } else if (scaledZ > 50) {
                    ctx.shadowBlur = 8
                    ctx.shadowColor = colors.shadowColor
                } else {
                    ctx.shadowBlur = 0
                }
            })

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [status])

    return (
        <div className="flex items-center justify-center w-full h-full bg-white rounded-2xl">
            <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="max-w-full max-h-full"
                style={{ imageRendering: 'crisp-edges' }}
            />
        </div>
    )
}
