export type GamePhase = 'menu' | 'countdown' | 'racing' | 'finished'

export interface GameState {
  phase: GamePhase
  speed: number
  currentLap: number
  totalLaps: number
  raceTime: number
  position: number
  countdown: number
  bestTime: number | null
}

export interface TrackPoint {
  x: number
  z: number
}
