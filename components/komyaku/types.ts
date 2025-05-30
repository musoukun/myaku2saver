import * as THREE from 'three'

export interface KomyakuData {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  radius: number
  originalRadius: number
  color: string
  mass: number
  driftDirection: THREE.Vector3
  eyePhase: number
  age: number
  canSplit: boolean
  isSplitting: boolean
  splitProgress: number
  splitDirection: THREE.Vector3
  isDying: boolean
  deathProgress: number
  opacity: number
  childSphere1Offset: THREE.Vector3
  childSphere2Offset: THREE.Vector3
  // パルスエフェクト用
  isPulsing: boolean
  pulseProgress: number
}

export const COLORS = {
  CYAN: '#4ECDC4',
  MAGENTA: '#E06B9A', 
  BLUE: '#4A90E2',
  RED: '#E74C3C'
}

export const INITIAL_KOMYAKU_COUNT = 6
export const MAX_KOMYAKU_COUNT = 15
export const DEATH_TRIGGER_COUNT = INITIAL_KOMYAKU_COUNT + 5
