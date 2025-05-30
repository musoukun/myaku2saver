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

// 新しい大きな子脈を生成する関数
export function createNewBornKomyaku(): KomyakuData {
  const colors = Object.values(COLORS)
  const radius = 0.8 + Math.random() * 0.4 // 初期サイズと同じかやや大きめ
  
  return {
    id: nextId++,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 4
    ),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.004
    ),
    radius,
    originalRadius: radius,
    color: colors[Math.floor(Math.random() * colors.length)],
    mass: radius,
    driftDirection: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize(),
    eyePhase: Math.random() * Math.PI * 2,
    age: 0,
    canSplit: true,
    isSplitting: false,
    splitProgress: 0,
    splitDirection: new THREE.Vector3(),
    isDying: false,
    deathProgress: 0,
    opacity: 1,
    childSphere1Offset: new THREE.Vector3(),
    childSphere2Offset: new THREE.Vector3(),
    isPulsing: true, // 新生児はパルスする
    pulseProgress: 0,
    generation: 0, // 新生児は第0世代
    isNewBorn: true
  }
}
export function createSplitKomyaku(originalKomyaku: KomyakuData): KomyakuData[] {
  const newRadius = originalKomyaku.originalRadius * 0.7
  // 分裂時は必ず同じ色にする
  const parentColor = originalKomyaku.color
  const childGeneration = originalKomyaku.generation + 1 // 世代を進める
  
  const komyaku1: KomyakuData = {
    id: nextId++,
    position: originalKomyaku.position.clone().add(originalKomyaku.childSphere1Offset),
    velocity: originalKomyaku.velocity.clone().add(originalKomyaku.splitDirection.clone().multiplyScalar(0.004)), // さらに遅く（0.008から0.004に）
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
    childSphere2Offset: new THREE.Vector3(),
    // パルスエフェクトで新しい子脈を強調
    isPulsing: true,
    pulseProgress: 0,
    generation: childGeneration,
    isNewBorn: false // 分裂産みは新生児ではない
  }
  
  const komyaku2: KomyakuData = {
    id: nextId++,
    position: originalKomyaku.position.clone().add(originalKomyaku.childSphere2Offset),
    velocity: originalKomyaku.velocity.clone().add(originalKomyaku.splitDirection.clone().multiplyScalar(-0.004)), // さらに遅く（-0.008から-0.004に）
    radius: newRadius,
    originalRadius: newRadius,
    color: parentColor, // 親と同じ色にする
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
    childSphere2Offset: new THREE.Vector3(),
    // パルスエフェクトで新しい子脈を強調
    isPulsing: true,
    pulseProgress: 0,
    generation: childGeneration,
    isNewBorn: false // 分裂産みは新生児ではない
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
  const bounds = { x: 9, y: 5, z: 3 } // 更に幅広い範囲
  const bounceRestitution = 0.7
  
  const newKomyakus: KomyakuData[] = []
  const shouldTriggerDeath = komyakus.length >= DEATH_TRIGGER_COUNT
  
  // 新生児生成の判定（一定確率で大きな子脈を生成）
  const shouldSpawnNewBorn = komyakus.length < MAX_KOMYAKU_COUNT - 2 && 
                           Math.random() < 0.002 && // 確率を上げる
                           komyakus.filter(k => k.isNewBorn).length === 0 && // 既に新生児がいない場合
                           komyakus.filter(k => k.generation === 0).length < 3 // 第0世代が3個未満
  
  if (shouldSpawnNewBorn) {
    const newBorn = createNewBornKomyaku()
    newKomyakus.push(newBorn)
  }
  
  for (let i = 0; i < komyakus.length; i++) {
    const komyaku = komyakus[i]
    
    komyaku.age += delta
    
    // パルスエフェクトの更新
    if (komyaku.isPulsing) {
      komyaku.pulseProgress += delta * 4 // パルスの速度
      if (komyaku.pulseProgress >= 1) {
        komyaku.isPulsing = false
        komyaku.pulseProgress = 0
        // パルス終了時に新生児フラグをリセット
        if (komyaku.isNewBorn) {
          komyaku.isNewBorn = false
        }
      }
    }
    
    // 消滅判定（高世代の小さな球体は早めに消滅）
    const ageDeathProbability = komyaku.generation >= 3 && komyaku.radius < 0.5 ? 0.004 : 0.002
    if (!komyaku.isDying && !komyaku.isSplitting && 
        (shouldTriggerDeath || komyaku.age > 20 + komyaku.generation * 5) && 
        Math.random() < ageDeathProbability) {
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
    
    // 分裂判定（世代が進みすぎたら分裂しない）
    const maxGeneration = 4 // 最大4世代まで
    if (!komyaku.isSplitting && !komyaku.isDying && komyaku.canSplit && 
        komyaku.age > 5 && komyaku.generation < maxGeneration && 
        komyaku.radius > 0.4 && Math.random() < 0.001) {
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
      komyaku.splitProgress += delta * 0.5 // 分裂をもっと遅く（0.8から0.5に）
      
      if (komyaku.splitProgress >= 1) {
        const splitKomyakus = createSplitKomyaku(komyaku)
        newKomyakus.push(...splitKomyakus)
        continue
      }
    }
    
    // 基本的な物理演算
    const driftForce = komyaku.driftDirection.clone().multiplyScalar(0.00001) // さらに遅く（0.00002から0.00001に）
    komyaku.velocity.add(driftForce)
    
    const randomForce = new THREE.Vector3(
      (Math.random() - 0.5) * 0.000015, // さらに遅く（0.00003から0.000015に）
      (Math.random() - 0.5) * 0.000015,
      (Math.random() - 0.5) * 0.000015
    )
    komyaku.velocity.add(randomForce)
    
    const floatForce = new THREE.Vector3(
      Math.sin(elapsedTime * 0.1 + komyaku.id) * 0.000005, // さらに遅く（0.2から0.1に、0.00001から0.000005に）
      Math.cos(elapsedTime * 0.08 + komyaku.id) * 0.000005, // 0.15から0.08に
      Math.sin(elapsedTime * 0.12 + komyaku.id) * 0.0000025 // 0.25から0.12に、0.000005から0.0000025に
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
