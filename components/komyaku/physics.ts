import * as THREE from 'three'
import { KomyakuData, COLORS, MAX_KOMYAKU_COUNT, DEATH_TRIGGER_COUNT } from './types'

let nextId = 100

// 近接検出（メタボール効果用）
export function checkNearby(komyaku1: KomyakuData, komyaku2: KomyakuData): boolean {
  const distance = komyaku1.position.distanceTo(komyaku2.position)
  return distance < (komyaku1.radius + komyaku2.radius) * 1.8 // より狭い範囲でメタボール効果
}

// 衝突検出関数
export function checkCollision(komyaku1: KomyakuData, komyaku2: KomyakuData): boolean {
  const distance = komyaku1.position.distanceTo(komyaku2.position)
  return distance < (komyaku1.radius + komyaku2.radius) * 1.2
}

// 弱い反発力の計算
export function applyRepulsion(komyaku1: KomyakuData, komyaku2: KomyakuData) {
  const dx = komyaku2.position.x - komyaku1.position.x
  const dy = komyaku2.position.y - komyaku1.position.y
  const dz = komyaku2.position.z - komyaku1.position.z
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
  
  if (distance === 0) return
  
  const nx = dx / distance
  const ny = dy / distance
  const nz = dz / distance
  
  const repulsionStrength = 0.00005
  const force = repulsionStrength / (distance * distance)
  
  komyaku1.velocity.x -= nx * force
  komyaku1.velocity.y -= ny * force
  komyaku1.velocity.z -= nz * force
  
  komyaku2.velocity.x += nx * force
  komyaku2.velocity.y += ny * force
  komyaku2.velocity.z += nz * force
}

// 分裂処理
export function createSplitKomyaku(originalKomyaku: KomyakuData): KomyakuData[] {
  const newRadius = originalKomyaku.originalRadius * 0.7
  const colors = Object.values(COLORS)
  
  const komyaku1: KomyakuData = {
    id: nextId++,
    position: originalKomyaku.position.clone().add(originalKomyaku.childSphere1Offset),
    velocity: originalKomyaku.velocity.clone().add(originalKomyaku.splitDirection.clone().multiplyScalar(0.02)),
    radius: newRadius,
    originalRadius: newRadius,
    color: originalKomyaku.color,
    mass: newRadius,
    driftDirection: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize(),
    eyePhase: Math.random() * Math.PI * 2,
    age: 0,
    canSplit: newRadius > 0.3,
    isSplitting: false,
    splitProgress: 0,
    splitDirection: new THREE.Vector3(),
    isDying: false,
    deathProgress: 0,
    opacity: 1,
    childSphere1Offset: new THREE.Vector3(),
    childSphere2Offset: new THREE.Vector3()
  }
  
  const komyaku2: KomyakuData = {
    id: nextId++,
    position: originalKomyaku.position.clone().add(originalKomyaku.childSphere2Offset),
    velocity: originalKomyaku.velocity.clone().add(originalKomyaku.splitDirection.clone().multiplyScalar(-0.02)),
    radius: newRadius,
    originalRadius: newRadius,
    color: colors[Math.floor(Math.random() * colors.length)],
    mass: newRadius,
    driftDirection: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize(),
    eyePhase: Math.random() * Math.PI * 2,
    age: 0,
    canSplit: newRadius > 0.3,
    isSplitting: false,
    splitProgress: 0,
    splitDirection: new THREE.Vector3(),
    isDying: false,
    deathProgress: 0,
    opacity: 1,
    childSphere1Offset: new THREE.Vector3(),
    childSphere2Offset: new THREE.Vector3()
  }
  
  return [komyaku1, komyaku2]
}

// 物理演算のメイン処理
export function updatePhysics(
  komyakus: KomyakuData[], 
  delta: number, 
  elapsedTime: number
): KomyakuData[] {
  const damping = 0.998
  const bounds = { x: 7, y: 3.5, z: 2.5 }
  const bounceRestitution = 0.7
  
  const newKomyakus: KomyakuData[] = []
  const shouldTriggerDeath = komyakus.length >= DEATH_TRIGGER_COUNT
  
  for (let i = 0; i < komyakus.length; i++) {
    const komyaku = komyakus[i]
    
    komyaku.age += delta
    
    // 消滅判定
    if (!komyaku.isDying && !komyaku.isSplitting && shouldTriggerDeath && Math.random() < 0.002) {
      komyaku.isDying = true
      komyaku.deathProgress = 0
    }
    
    // 消滅アニメーション進行
    if (komyaku.isDying) {
      komyaku.deathProgress += delta * 0.8
      
      if (komyaku.deathProgress >= 1) {
        continue
      }
    }
    
    // 分裂判定
    if (!komyaku.isSplitting && !komyaku.isDying && komyaku.canSplit && komyaku.age > 5 && Math.random() < 0.001) {
      komyaku.isSplitting = true
      komyaku.splitProgress = 0
      komyaku.splitDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize()
      komyaku.childSphere1Offset = new THREE.Vector3()
      komyaku.childSphere2Offset = new THREE.Vector3()
    }
    
    // 分裂アニメーション進行
    if (komyaku.isSplitting) {
      komyaku.splitProgress += delta * 0.8 // 分裂を遅く（1.5から0.8に）
      
      if (komyaku.splitProgress >= 1) {
        const splitKomyakus = createSplitKomyaku(komyaku)
        newKomyakus.push(...splitKomyakus)
        continue
      }
    }
    
    // 基本的な物理演算
    const driftForce = komyaku.driftDirection.clone().multiplyScalar(0.00002) // 遅く（0.00005から0.00002に）
    komyaku.velocity.add(driftForce)
    
    const randomForce = new THREE.Vector3(
      (Math.random() - 0.5) * 0.00003, // 遅く（0.00008から0.00003に）
      (Math.random() - 0.5) * 0.00003,
      (Math.random() - 0.5) * 0.00003
    )
    komyaku.velocity.add(randomForce)
    
    const floatForce = new THREE.Vector3(
      Math.sin(elapsedTime * 0.2 + komyaku.id) * 0.00001, // 遅く（0.4から0.2に、加速度も0.00002から0.00001に）
      Math.cos(elapsedTime * 0.15 + komyaku.id) * 0.00001, // 0.3から0.15に
      Math.sin(elapsedTime * 0.25 + komyaku.id) * 0.000005 // 0.5から0.25に、0.00001から0.000005に
    )
    komyaku.velocity.add(floatForce)
    
    komyaku.velocity.multiplyScalar(damping)
    
    const deltaTime = Math.min(delta, 1/30)
    komyaku.position.add(komyaku.velocity.clone().multiplyScalar(deltaTime * 60))
    
    // 境界での跳ね返り
    if (komyaku.position.x + komyaku.radius > bounds.x) {
      komyaku.position.x = bounds.x - komyaku.radius
      komyaku.velocity.x *= -bounceRestitution
    } else if (komyaku.position.x - komyaku.radius < -bounds.x) {
      komyaku.position.x = -bounds.x + komyaku.radius
      komyaku.velocity.x *= -bounceRestitution
    }
    
    if (komyaku.position.y + komyaku.radius > bounds.y) {
      komyaku.position.y = bounds.y - komyaku.radius
      komyaku.velocity.y *= -bounceRestitution
    } else if (komyaku.position.y - komyaku.radius < -bounds.y) {
      komyaku.position.y = -bounds.y + komyaku.radius
      komyaku.velocity.y *= -bounceRestitution
    }
    
    if (komyaku.position.z + komyaku.radius > bounds.z) {
      komyaku.position.z = bounds.z - komyaku.radius
      komyaku.velocity.z *= -bounceRestitution
    } else if (komyaku.position.z - komyaku.radius < -bounds.z) {
      komyaku.position.z = -bounds.z + komyaku.radius
      komyaku.velocity.z *= -bounceRestitution
    }
    
    newKomyakus.push(komyaku)
  }
  
  // 弱い反発力を適用
  for (let i = 0; i < newKomyakus.length; i++) {
    for (let j = i + 1; j < newKomyakus.length; j++) {
      if (checkCollision(newKomyakus[i], newKomyakus[j])) {
        applyRepulsion(newKomyakus[i], newKomyakus[j])
      }
    }
  }
  
  if (newKomyakus.length > MAX_KOMYAKU_COUNT) {
    newKomyakus.splice(MAX_KOMYAKU_COUNT)
  }
  
  return newKomyakus
}
