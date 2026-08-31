import { useEffect, useRef } from 'react'

export interface KeyState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  brake: boolean
}

export function useKeyboard() {
  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          keys.current.forward = true
          break
        case 'ArrowDown':
        case 'KeyS':
          keys.current.backward = true
          break
        case 'ArrowLeft':
        case 'KeyA':
          keys.current.left = true
          break
        case 'ArrowRight':
        case 'KeyD':
          keys.current.right = true
          break
        case 'Space':
          keys.current.brake = true
          break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          keys.current.forward = false
          break
        case 'ArrowDown':
        case 'KeyS':
          keys.current.backward = false
          break
        case 'ArrowLeft':
        case 'KeyA':
          keys.current.left = false
          break
        case 'ArrowRight':
        case 'KeyD':
          keys.current.right = false
          break
        case 'Space':
          keys.current.brake = false
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return keys
}
