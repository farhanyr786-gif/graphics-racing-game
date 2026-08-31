import { useEffect, useState } from 'react'
import { GamePhase } from '../lib/types'

interface HUDProps {
  phase: GamePhase
  speed: number
  currentLap: number
  totalLaps: number
  raceTime: number
  position: number
  countdown: number
  bestTime: number | null
  onRestart: () => void
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const centis = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`
}

function PositionSuffix(pos: number): string {
  if (pos === 1) return 'st'
  if (pos === 2) return 'nd'
  if (pos === 3) return 'rd'
  return 'th'
}

function getBestTimes(): number[] {
  try {
    return JSON.parse(localStorage.getItem('speedracer_best') || '[]')
  } catch {
    return []
  }
}

function saveBestTime(time: number) {
  const times = getBestTimes()
  times.push(time)
  times.sort((a, b) => a - b)
  localStorage.setItem('speedracer_best', JSON.stringify(times.slice(0, 10)))
}

export function HUD({
  phase,
  speed,
  currentLap,
  totalLaps,
  raceTime,
  position,
  countdown,
  bestTime,
  onRestart,
}: HUDProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (phase === 'finished' && !saved) {
      saveBestTime(raceTime)
      setSaved(true)
    }
  }, [phase, raceTime, saved])

  const kmh = Math.round(speed * 3.6)
  const bestTimes = getBestTimes()

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Countdown overlay */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            key={countdown}
            className="countdown-anim racing-text text-[120px] font-bold drop-shadow-2xl"
            style={{
              color: countdown === 0 ? '#00e676' : '#ffea00',
              textShadow: `0 0 40px ${countdown === 0 ? '#00e676' : '#ffea00'}`,
            }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {/* Racing HUD */}
      {phase === 'racing' && (
        <>
          {/* Speed - bottom center */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass rounded-2xl px-8 py-4 text-center">
            <div className="racing-text text-5xl font-bold text-white tabular-nums">
              {kmh}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">km/h</div>
          </div>

          {/* Lap counter - top left */}
          <div className="absolute top-6 left-6 glass rounded-xl px-5 py-3 slide-up">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Lap</div>
            <div className="racing-text text-3xl font-bold text-white">
              {Math.min(currentLap, totalLaps)}<span className="text-gray-500 text-xl">/{totalLaps}</span>
            </div>
          </div>

          {/* Timer - top center */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 glass rounded-xl px-6 py-3 slide-up">
            <div className="racing-text text-2xl font-bold text-white tabular-nums">
              {formatTime(raceTime)}
            </div>
          </div>

          {/* Position - top right */}
          <div className="absolute top-6 right-6 glass rounded-xl px-5 py-3 slide-up">
            <div className="racing-text text-4xl font-bold" style={{ color: position === 1 ? '#ffea00' : '#ffffff' }}>
              {position}<sup className="text-lg">{PositionSuffix(position)}</sup>
            </div>
          </div>

          {/* Speed bar - right side */}
          <div className="absolute right-6 bottom-8 glass rounded-xl px-3 py-4 w-12 h-48 flex flex-col items-center justify-end">
            <div className="w-4 h-full bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full rounded-full transition-all duration-100"
                style={{
                  height: `${Math.min(kmh / 200 * 100, 100)}%`,
                  background: kmh > 150 ? '#ff1744' : kmh > 80 ? '#ffea00' : '#00e676',
                }}
              />
            </div>
          </div>

          {/* Controls hint - bottom left */}
          <div className="absolute bottom-8 left-6 glass rounded-xl px-4 py-3 text-xs text-gray-400">
            <div className="flex gap-4">
              <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">W</kbd> Accelerate</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">A/D</kbd> Steer</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">Space</kbd> Brake</span>
            </div>
          </div>
        </>
      )}

      {/* Finish screen */}
      {phase === 'finished' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto">
          <div className="glass rounded-3xl p-10 text-center max-w-lg slide-up">
            <div className="racing-text text-5xl font-bold glow-text mb-2" style={{ color: '#ffea00' }}>
              RACE COMPLETE!
            </div>
            <div className="racing-text text-3xl text-white mb-6">
              Position: <span style={{ color: position === 1 ? '#ffea00' : '#ffffff' }}>
                {position}{PositionSuffix(position)}
              </span>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Your Time</span>
                <span className="text-white font-mono">{formatTime(raceTime)}</span>
              </div>
              {bestTime && (
                <div className="flex justify-between text-lg">
                  <span className="text-gray-400">Best Time</span>
                  <span className="text-green-400 font-mono">{formatTime(bestTime)}</span>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            {bestTimes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Personal Best</h3>
                <div className="space-y-1">
                  {bestTimes.slice(0, 5).map((t, i) => (
                    <div key={i} className="flex justify-between text-sm px-3 py-1.5 rounded-lg" style={{
                      background: i === 0 ? 'rgba(255, 234, 0, 0.1)' : 'transparent',
                    }}>
                      <span className="text-gray-500">#{i + 1}</span>
                      <span className={`font-mono ${i === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {formatTime(t)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onRestart}
              className="racing-text text-xl px-10 py-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ff1744, #d500f9)',
                color: '#fff',
                boxShadow: '0 0 30px rgba(255, 23, 68, 0.4)',
              }}
            >
              RACE AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
