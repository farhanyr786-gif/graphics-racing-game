import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox, useSphere } from '@react-three/cannon'
import * as THREE from 'three'
import { KeyState } from '../hooks/useKeyboard'

interface Car3DProps {
  color?: string
  position?: [number, number, number]
  keys?: React.RefObject<KeyState>
  onPositionUpdate?: (pos: THREE.Vector3, angle: number, speed: number) => void
  isPlayer?: boolean
}

export function Car3D({ color = '#ff1744', position = [0, 0.5, 0], keys, onPositionUpdate, isPlayer = false }: Car3DProps) {
  const velocity = useRef({ x: 0, z: 0 })
  const angleRef = useRef(0)
  const speedRef = useRef(0)
  const wheelAngle = useRef(0)
  const skidMarks = useRef<THREE.Vector3[]>([])

  const [bodyRef, bodyApi] = useBox<THREE.Mesh>(() => ({
    mass: 1,
    position,
    args: [1.6, 0.6, 3],
    material: { friction: 0.3, restitution: 0.1 },
    linearDamping: 0.5,
    angularDamping: 1,
    type: isPlayer ? 'Dynamic' : 'Kinematic',
  }))

  // Subtle body tilt on steering
  const steerTilt = useRef(0)

  useFrame((_, delta) => {
    if (!bodyRef.current) return

    const pos = bodyRef.current.position
    const maxSpeed = isPlayer ? 50 : 30
    const acceleration = isPlayer ? 28 : 20
    const brakePower = 35
    const turnSpeed = isPlayer ? 2.2 : 1.8
    const friction = 0.97

    if (isPlayer && keys?.current) {
      const k = keys.current

      // Acceleration
      if (k.forward) {
        speedRef.current = Math.min(speedRef.current + acceleration * delta, maxSpeed)
      } else if (k.backward) {
        speedRef.current = Math.max(speedRef.current - brakePower * delta, -maxSpeed * 0.3)
      } else {
        speedRef.current *= friction
      }

      // Braking
      if (k.brake) {
        speedRef.current *= 0.92
      }

      // Steering
      if (Math.abs(speedRef.current) > 0.5) {
        const steerFactor = Math.min(Math.abs(speedRef.current) / 15, 1)
        if (k.left) {
          angleRef.current += turnSpeed * steerFactor * delta
          steerTilt.current = THREE.MathUtils.lerp(steerTilt.current, 0.15, 0.1)
        } else if (k.right) {
          angleRef.current -= turnSpeed * steerFactor * delta
          steerTilt.current = THREE.MathUtils.lerp(steerTilt.current, -0.15, 0.1)
        } else {
          steerTilt.current = THREE.MathUtils.lerp(steerTilt.current, 0, 0.1)
        }
      }

      // Movement
      velocity.current.x = Math.sin(angleRef.current) * speedRef.current
      velocity.current.z = Math.cos(angleRef.current) * speedRef.current

      const newX = pos.x + velocity.current.x * delta
      const newZ = pos.z + velocity.current.z * delta

      bodyApi.position.set(newX, 0.5, newZ)
      bodyApi.rotation.set(0, angleRef.current, 0)

      onPositionUpdate?.(
        new THREE.Vector3(newX, 0.5, newZ),
        angleRef.current,
        Math.abs(speedRef.current)
      )
    }

    // Wheel spin
    wheelAngle.current += speedRef.current * delta * 0.5

    // Body roll on turn
    if (bodyRef.current) {
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(
        bodyRef.current.rotation.z,
        steerTilt.current,
        0.1
      )
    }
  })

  return (
    <group ref={bodyRef as any}>
      {/* Car body - main chassis */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.5, 0.4, 2.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Cabin/roof */}
      <mesh position={[0, 0.55, -0.1]} castShadow>
        <boxGeometry args={[1.2, 0.35, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.5, 0.65]} rotation={[0.3, 0, 0]}>
        <planeGeometry args={[1.1, 0.4]} />
        <meshStandardMaterial color="#88ccff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Rear windshield */}
      <mesh position={[0, 0.5, -0.8]} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[1.1, 0.35]} />
        <meshStandardMaterial color="#88ccff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.15, 1.5]}>
        <boxGeometry args={[1.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.15, -1.5]}>
        <boxGeometry args={[1.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
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

      {/* Tail lights */}
      <mesh position={[0.55, 0.25, -1.45]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-0.55, 0.25, -1.45]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>

      {/* Racing stripe */}
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.15, 0.01, 2.6]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      {[[-0.75, -0.05, 0.9], [0.75, -0.05, 0.9], [-0.75, -0.05, -0.9], [0.75, -0.05, -0.9]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 16]} />
            <meshStandardMaterial color="#111" roughness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.2, 8]} />
            <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Spoiler */}
      <mesh position={[0, 0.65, -1.3]}>
        <boxGeometry args={[1.3, 0.05, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Spoiler supports */}
      <mesh position={[0.5, 0.52, -1.3]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.5, 0.52, -1.3]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}
