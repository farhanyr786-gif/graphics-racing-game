import { TrackPoint } from './types'

// Oval-ish race track with curves
export const TRACK_POINTS: TrackPoint[] = [
  { x: 0, z: 0 },
  { x: 8, z: -2 },
  { x: 16, z: -6 },
  { x: 24, z: -12 },
  { x: 30, z: -20 },
  { x: 34, z: -30 },
  { x: 36, z: -40 },
  { x: 36, z: -50 },
  { x: 34, z: -60 },
  { x: 30, z: -68 },
  { x: 24, z: -74 },
  { x: 16, z: -78 },
  { x: 8, z: -80 },
  { x: 0, z: -80 },
  { x: -8, z: -78 },
  { x: -16, z: -74 },
  { x: -24, z: -68 },
  { x: -30, z: -60 },
  { x: -34, z: -50 },
  { x: -36, z: -40 },
  { x: -36, z: -30 },
  { x: -34, z: -20 },
  { x: -24, z: -12 },
  { x: -16, z: -6 },
  { x: -8, z: -2 },
]

export const TRACK_WIDTH = 8
export const TOTAL_LAPS = 3
export const AI_CAR_COUNT = 2

// Catmull-Rom spline interpolation for smooth track path
export function getTrackPoint(t: number): { x: number; z: number; angle: number } {
  const pts = TRACK_POINTS
  const n = pts.length
  const f = ((t % 1) + 1) % 1 * n
  const i = Math.floor(f)
  const frac = f - i

  const p0 = pts[(i - 1 + n) % n]
  const p1 = pts[i % n]
  const p2 = pts[(i + 1) % n]
  const p3 = pts[(i + 2) % n]

  const t2 = frac * frac
  const t3 = t2 * frac

  const x = 0.5 * (
    (2 * p1.x) +
    (-p0.x + p2.x) * frac +
    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
  )

  const z = 0.5 * (
    (2 * p1.z) +
    (-p0.z + p2.z) * frac +
    (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
    (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3
  )

  // Derivative for angle
  const dx = 0.5 * (
    (-p0.x + p2.x) +
    (4 * p0.x - 10 * p1.x + 8 * p2.x - 2 * p3.x) * frac +
    (-3 * p0.x + 9 * p1.x - 9 * p2.x + 3 * p3.x) * t2
  )
  const dz = 0.5 * (
    (-p0.z + p2.z) +
    (4 * p0.z - 10 * p1.z + 8 * p2.z - 2 * p3.z) * frac +
    (-3 * p0.z + 9 * p1.z - 9 * p2.z + 3 * p3.z) * t2
  )

  const angle = Math.atan2(dx, dz)

  return { x, z, angle }
}

// Get track length approximation
export function getTrackLength(): number {
  let total = 0
  const steps = 500
  for (let i = 0; i < steps; i++) {
    const a = getTrackPoint(i / steps)
    const b = getTrackPoint((i + 1) / steps)
    const dx = b.x - a.x
    const dz = b.z - a.z
    total += Math.sqrt(dx * dx + dz * dz)
  }
  return total
}

// Get closest point on track to a world position
export function getClosestTrackT(worldX: number, worldZ: number): number {
  let bestT = 0
  let bestDist = Infinity
  const steps = 200
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const p = getTrackPoint(t)
    const dx = p.x - worldX
    const dz = p.z - worldZ
    const dist = dx * dx + dz * dz
    if (dist < bestDist) {
      bestDist = dist
      bestT = t
    }
  }
  // Refine
  for (let i = -10; i <= 10; i++) {
    const t = bestT + i / (steps * 10)
    const p = getTrackPoint(t)
    const dx = p.x - worldX
    const dz = p.z - worldZ
    const dist = dx * dx + dz * dz
    if (dist < bestDist) {
      bestDist = dist
      bestT = t
    }
  }
  return bestT
}
