import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraProps {
  playerPosition: React.RefObject<THREE.Vector3 | null>
  playerAngle: React.RefObject<number>
}

export function GameCamera({ playerPosition, playerAngle }: CameraProps) {
  const { camera } = useThree()
  const smoothPos = useRef(new THREE.Vector3(0, 8, 12))
  const smoothLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    if (!playerPosition.current) return

    const pos = playerPosition.current
    const angle = playerAngle.current ?? 0

    // Camera offset behind and above the car
    const distance = 12
    const height = 7
    const lookAhead = 5

    const safeAngle = angle ?? 0
    const targetX = pos.x - Math.sin(safeAngle) * distance
    const targetZ = pos.z - Math.cos(safeAngle) * distance
    const targetY = pos.y + height

    const lookAtX = pos.x + Math.sin(safeAngle) * lookAhead
    const lookAtZ = pos.z + Math.cos(safeAngle) * lookAhead

    // Smooth follow
    smoothPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.06)
    smoothLookAt.current.lerp(new THREE.Vector3(lookAtX, pos.y + 1, lookAtZ), 0.08)

    camera.position.copy(smoothPos.current)
    camera.lookAt(smoothLookAt.current)
  })

  return null
}
