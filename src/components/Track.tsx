import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useBox } from '@react-three/cannon'
import { getTrackPoint, TRACK_WIDTH } from '../lib/trackData'

const TRACK_SEGMENTS = 200

function TrackSurface() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const points: THREE.Vector3[] = []
    const outerPoints: THREE.Vector3[] = []
    const innerPoints: THREE.Vector3[] = []

    for (let i = 0; i <= TRACK_SEGMENTS; i++) {
      const t = i / TRACK_SEGMENTS
      const p = getTrackPoint(t)
      const pNext = getTrackPoint((t + 0.005) % 1)
      const dx = pNext.x - p.x
      const dz = pNext.z - p.z
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      const nx = -dz / len * TRACK_WIDTH * 0.5
      const nz = dx / len * TRACK_WIDTH * 0.5

      outerPoints.push(new THREE.Vector3(p.x + nx, 0.01, p.z + nz))
      innerPoints.push(new THREE.Vector3(p.x - nx, 0.01, p.z - nz))
    }

    // Build geometry manually
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    for (let i = 0; i < TRACK_SEGMENTS; i++) {
      const vi = i * 2
      positions.push(outerPoints[i].x, outerPoints[i].y, outerPoints[i].z)
      positions.push(innerPoints[i].x, innerPoints[i].y, innerPoints[i].z)
      uvs.push(0, i / TRACK_SEGMENTS * 20)
      uvs.push(1, i / TRACK_SEGMENTS * 20)

      if (i < TRACK_SEGMENTS) {
        const a = vi
        const b = vi + 1
        const c = vi + 2
        const d = vi + 3
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [])

  // Create track texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    // Asphalt base
    ctx.fillStyle = '#333338'
    ctx.fillRect(0, 0, 256, 256)

    // Add noise/grain
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const brightness = 40 + Math.random() * 30
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 5})`
      ctx.fillRect(x, y, 2, 2)
    }

    // Center dashed line
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.setLineDash([20, 20])
    ctx.beginPath()
    ctx.moveTo(128, 0)
    ctx.lineTo(128, 256)
    ctx.stroke()

    // Edge lines
    ctx.strokeStyle = '#ffcc00'
    ctx.lineWidth = 4
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(10, 0)
    ctx.lineTo(10, 256)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(246, 0)
    ctx.lineTo(246, 256)
    ctx.stroke()

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
    </mesh>
  )
}

function TrackBarriers() {
  const barriers = useMemo(() => {
    const items: { pos: [number, number, number]; rot: number; scale: [number, number, number]; color: string }[] = []

    for (let i = 0; i < TRACK_SEGMENTS; i += 2) {
      const t = i / TRACK_SEGMENTS
      const p = getTrackPoint(t)
      const pNext = getTrackPoint((t + 0.01) % 1)
      const dx = pNext.x - p.x
      const dz = pNext.z - p.z
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      const nx = -dz / len
      const nz = dx / len
      const angle = Math.atan2(dx, dz)

      const offset = TRACK_WIDTH * 0.55

      // Outer barrier
      const color = i % 6 < 3 ? '#ff1744' : '#ffffff'
      items.push({
        pos: [p.x + nx * offset, 0.3, p.z + nz * offset],
        rot: angle,
        scale: [0.2, 0.6, 1.2],
        color,
      })

      // Inner barrier
      const color2 = i % 6 < 3 ? '#2979ff' : '#ffffff'
      items.push({
        pos: [p.x - nx * offset, 0.3, p.z - nz * offset],
        rot: angle,
        scale: [0.2, 0.6, 1.2],
        color: color2,
      })
    }
    return items
  }, [])

  return (
    <group>
      {barriers.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={[0, b.rot, 0]} castShadow receiveShadow>
          <boxGeometry args={b.scale as [number, number, number]} />
          <meshStandardMaterial color={b.color} metalness={0.3} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function FinishLine() {
  const p = getTrackPoint(0)
  const pNext = getTrackPoint(0.01)
  const angle = Math.atan2(pNext.x - p.x, pNext.z - p.z)

  return (
    <group position={[p.x, 0.02, p.z]} rotation={[0, angle, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[TRACK_WIDTH, 0.05, 2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Checkered pattern */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[(row - 3.5) * (TRACK_WIDTH / 8), 0.03, (col - 1.5) * 0.5]}
            receiveShadow
          >
            <boxGeometry args={[TRACK_WIDTH / 8 - 0.02, 0.02, 0.48]} />
            <meshStandardMaterial
              color={(row + col) % 2 === 0 ? '#111111' : '#ffffff'}
            />
          </mesh>
        ))
      )}
      {/* Finish arch */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[TRACK_WIDTH + 2, 0.4, 0.4]} />
        <meshStandardMaterial color="#ffea00" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-TRACK_WIDTH / 2 - 0.5, 1.75, 0]}>
        <boxGeometry args={[0.3, 3.5, 0.3]} />
        <meshStandardMaterial color="#ffea00" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[TRACK_WIDTH / 2 + 0.5, 1.75, 0]}>
        <boxGeometry args={[0.3, 3.5, 0.3]} />
        <meshStandardMaterial color="#ffea00" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -40]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#2d5a1e" roughness={1} />
    </mesh>
  )
}

function BarrierPhysics() {
  const barriers = useMemo(() => {
    const items: { pos: [number, number, number]; size: [number, number, number] }[] = []
    for (let i = 0; i < TRACK_SEGMENTS; i += 3) {
      const t = i / TRACK_SEGMENTS
      const p = getTrackPoint(t)
      const pNext = getTrackPoint((t + 0.01) % 1)
      const dx = pNext.x - p.x
      const dz = pNext.z - p.z
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      const nx = -dz / len
      const nz = dx / len
      const angle = Math.atan2(dx, dz)
      const offset = TRACK_WIDTH * 0.55

      items.push({
        pos: [p.x + nx * offset, 0.3, p.z + nz * offset],
        size: [0.3, 0.6, 1.5],
      })
      items.push({
        pos: [p.x - nx * offset, 0.3, p.z - nz * offset],
        size: [0.3, 0.6, 1.5],
      })
    }
    return items
  }, [])

  return (
    <>
      {barriers.map((b, i) => (
        <BarrierBlock key={i} position={b.pos} size={b.size} />
      ))}
    </>
  )
}

function BarrierBlock({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  useBox(() => ({
    type: 'Static',
    position,
    args: size,
    material: { friction: 0.5, restitution: 0.3 },
  }))
  return null
}

export function Track() {
  return (
    <group>
      <Ground />
      <TrackSurface />
      <TrackBarriers />
      <BarrierPhysics />
      <FinishLine />
    </group>
  )
}
