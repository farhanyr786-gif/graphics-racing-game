import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import * as THREE from 'three'
import { getTrackPoint } from '../lib/trackData'

interface OpponentProps {
  color: string
  startOffset: number
  speed: number
  onProgress?: (t: number) => void
}

function OpponentCar({ color, startOffset, speed, onProgress }: OpponentProps) {
  const progress = useRef(startOffset)
  const wheelSpin = useRef(0)

  const [bodyRef, bodyApi] = useBox<THREE.Mesh>(() => ({
    mass: 1,
    position: [0, 0.5, 0],
    args: [1.6, 0.6, 3],
    type: 'Kinematic',
    material: { friction: 0.3, restitution: 0.1 },
  }))

  useFrame((_, delta) => {
    progress.current = (progress.current + speed * delta * 0.015) % 1
    const p = getTrackPoint(progress.current)
    const pNext = getTrackPoint((progress.current + 0.005) % 1)
    const angle = Math.atan2(pNext.x - p.x, pNext.z - p.z)

    bodyApi.position.set(p.x, 0.5, p.z)
    bodyApi.rotation.set(0, angle, 0)

    wheelSpin.current += speed * delta * 0.5
    onProgress?.(progress.current)
  })

  return (
    <group ref={bodyRef as any}>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.5, 0.4, 2.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.55, -0.1]} castShadow>
        <boxGeometry args={[1.2, 0.35, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.5, 0.65]} rotation={[0.3, 0, 0]}>
        <planeGeometry args={[1.1, 0.4]} />
        <meshStandardMaterial color="#88ccff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.5, 0.25, 1.45]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffaa" emissive="#ffffaa" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.5, 0.25, 1.45]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffaa" emissive="#ffffaa" emissiveIntensity={2} />
      </mesh>

      {/* Racing stripe */}
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.15, 0.01, 2.6]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      {[[-0.75, -0.05, 0.9], [0.75, -0.05, 0.9], [-0.75, -0.05, -0.9], [0.75, -0.05, -0.9]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.18, 16]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      ))}

      {/* Spoiler */}
      <mesh position={[0, 0.65, -1.3]}>
        <boxGeometry args={[1.3, 0.05, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

interface OpponentsProps {
  playerProgress: number
}

export function Opponents({ playerProgress }: OpponentsProps) {
  const ai1Progress = useRef(0)
  const ai2Progress = useRef(0)

  return (
    <group>
      <OpponentCar
        color="#2979ff"
        startOffset={0.15}
        speed={22}
        onProgress={(t) => { ai1Progress.current = t }}
      />
      <OpponentCar
        color="#00e676"
        startOffset={0.3}
        speed={20}
        onProgress={(t) => { ai2Progress.current = t }}
      />
    </group>
  )
}

export function useOpponentProgress() {
  return { ai1: useRef(0), ai2: useRef(0) }
}
