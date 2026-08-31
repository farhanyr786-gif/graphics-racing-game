import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import * as THREE from 'three'
import { Car3D } from './components/Car3D'
import { Track } from './components/Track'
import { Opponents } from './components/Opponents'
import { GameCamera } from './components/GameCamera'
import { SceneLighting, Environment } from './components/Scene'
import { HUD } from './components/HUD'
import { useKeyboard } from './hooks/useKeyboard'
import { GamePhase } from './lib/types'
import { TOTAL_LAPS } from './lib/trackData'
import { getTrackPoint, getClosestTrackT } from './lib/trackData'

function Game() {
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [speed, setSpeed] = useState(0)
  const [currentLap, setCurrentLap] = useState(1)
  const [raceTime, setRaceTime] = useState(0)
  const [position, setPosition] = useState(1)
  const [countdown, setCountdown] = useState(3)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [gameKey, setGameKey] = useState(0)

  const playerPosition = useRef<THREE.Vector3 | null>(null)
  const playerAngle = useRef(0)
  const lastT = useRef(0)
  const lapCrossings = useRef(0)
  const raceTimerRef = useRef(0)
  const raceStartTime = useRef(0)

  const keys = useKeyboard()

  // Load best time
  useEffect(() => {
    try {
      const times = JSON.parse(localStorage.getItem('speedracer_best') || '[]')
      if (times.length > 0) setBestTime(times[0])
    } catch {}
  }, [])

  const startRace = useCallback(() => {
    setPhase('countdown')
    setCountdown(3)
    setCurrentLap(1)
    setRaceTime(0)
    setPosition(1)
    setSpeed(0)
    lapCrossings.current = 0
    lastT.current = 0
    raceTimerRef.current = 0
    raceStartTime.current = 0

    let count = 3
    const timer = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else if (count === 0) {
        setCountdown(0)
        raceStartTime.current = performance.now()
        setPhase('racing')
        clearInterval(timer)
      }
    }, 1000)
  }, [])

  const onRestart = useCallback(() => {
    setGameKey(k => k + 1)
    setPhase('menu')
    setCurrentLap(1)
    setRaceTime(0)
    setPosition(1)
    setSpeed(0)
  }, [])

  const handlePositionUpdate = useCallback((pos: THREE.Vector3, angle: number, spd: number) => {
    playerPosition.current = pos
    playerAngle.current = angle
    setSpeed(spd)

    // Track progress
    const currentT = getClosestTrackT(pos.x, pos.z)
    const tDiff = currentT - lastT.current

    // Detect lap crossing (crossing from ~0.95 back to ~0.05)
    if (lastT.current > 0.9 && currentT < 0.1 && tDiff < 0) {
      lapCrossings.current++
      if (lapCrossings.current >= TOTAL_LAPS) {
        const finalTime = performance.now() - raceStartTime.current
        setRaceTime(finalTime)
        setPhase('finished')
        return
      }
      setCurrentLap(lapCrossings.current + 1)
    }

    lastT.current = currentT

    // Update race time while racing
    if (raceStartTime.current > 0) {
      setRaceTime(performance.now() - raceStartTime.current)
    }

    // Calculate position based on track progress
    const playerProgress = lapCrossings.current + currentT
    // Simple position calculation (would need opponent progress for accurate positioning)
    setPosition(1)
  }, [])

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 500, position: [0, 8, 12] }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#1a1a2e')
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <Physics
          gravity={[0, -20, 0]}
          defaultContactMaterial={{
            friction: 0.4,
            restitution: 0.2,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
          }}
          iterations={10}
          tolerance={0.0001}
        >
          <SceneLighting />
          <Environment />

          <Track />

          {phase !== 'menu' && (
            <>
              <Car3D
                key={`player-${gameKey}`}
                color="#ff1744"
                position={[0, 0.5, 2]}
                keys={keys}
                onPositionUpdate={handlePositionUpdate}
                isPlayer
              />
              <Opponents
                key={`opponents-${gameKey}`}
                playerProgress={0}
              />
            </>
          )}

          <GameCamera playerPosition={playerPosition} playerAngle={playerAngle} />
        </Physics>
      </Canvas>

      <HUD
        phase={phase}
        speed={speed}
        currentLap={currentLap}
        totalLaps={TOTAL_LAPS}
        raceTime={raceTime}
        position={position}
        countdown={countdown}
        bestTime={bestTime}
        onRestart={onRestart}
      />

      {/* Menu overlay */}
      {phase === 'menu' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 flex items-center justify-center z-40">
          <div className="text-center slide-up">
            <h1
              className="racing-text text-7xl font-bold mb-2 glow-text"
              style={{
                background: 'linear-gradient(135deg, #ff1744, #ffea00, #ff1744)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% auto',
              }}
            >
              SPEED RACER
            </h1>
            <p className="racing-text text-xl text-gray-300 mb-1 tracking-widest">3D ARCADE RACING</p>
            <div className="flex items-center gap-2 justify-center mb-10">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-neon-red"></div>
              <div className="w-2 h-2 rounded-full bg-neon-red"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-neon-red"></div>
            </div>

            <button
              onClick={startRace}
              className="racing-text text-2xl px-14 py-5 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 mb-8"
              style={{
                background: 'linear-gradient(135deg, #ff1744, #d500f9)',
                color: '#fff',
                boxShadow: '0 0 40px rgba(255, 23, 68, 0.5), 0 0 80px rgba(255, 23, 68, 0.2)',
              }}
            >
              START RACE
            </button>

            {bestTime && (
              <div className="glass rounded-xl px-6 py-3 inline-block">
                <span className="text-gray-400 text-sm">Best Time: </span>
                <span className="text-green-400 font-mono text-lg">
                  {Math.floor(bestTime / 60000).toString().padStart(2, '0')}:
                  {Math.floor((bestTime % 60000) / 1000).toString().padStart(2, '0')}.
                  {Math.floor((bestTime % 1000) / 10).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            <div className="mt-8 glass rounded-xl px-6 py-4 inline-block text-sm text-gray-400">
              <div className="flex gap-6">
                <span><kbd className="px-2 py-1 bg-gray-700 rounded text-white text-xs">W/↑</kbd> Accelerate</span>
                <span><kbd className="px-2 py-1 bg-gray-700 rounded text-white text-xs">A/↑ D/→</kbd> Steer</span>
                <span><kbd className="px-2 py-1 bg-gray-700 rounded text-white text-xs">Space</kbd> Brake</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return <Game />
}
