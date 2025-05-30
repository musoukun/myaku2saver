'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 球体の色定義（画像に合わせて調整）
const COLORS = {
  CYAN: '#4ECDC4',    // 明るいシアン
  MAGENTA: '#E06B9A', // ピンクがかった紫 
  BLUE: '#4A90E2',    // 明るい青
  RED: '#E74C3C'      // 赤色
}

// 物理プロパティを持つ球体の型定義
interface BlobData {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  radius: number
  color: string
  mass: number
  driftDirection: THREE.Vector3
}

// 衝突検出関数
function checkCollision(blob1: BlobData, blob2: BlobData): boolean {
  const distance = blob1.position.distanceTo(blob2.position)
  return distance < (blob1.radius + blob2.radius) * 1.2 // 少し広めの範囲で反発
}

// 弱い反発力の計算
function applyRepulsion(blob1: BlobData, blob2: BlobData) {
  const dx = blob2.position.x - blob1.position.x
  const dy = blob2.position.y - blob1.position.y
  const dz = blob2.position.z - blob1.position.z
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
  
  if (distance === 0) return
  
  // 正規化された方向ベクトル
  const nx = dx / distance
  const ny = dy / distance
  const nz = dz / distance
  
  // 弱い反発力
  const repulsionStrength = 0.00005
  const force = repulsionStrength / (distance * distance)
  
  blob1.velocity.x -= nx * force
  blob1.velocity.y -= ny * force
  blob1.velocity.z -= nz * force
  
  blob2.velocity.x += nx * force
  blob2.velocity.y += ny * force
  blob2.velocity.z += nz * force
}

// 個別の球体コンポーネント
interface BlobProps {
  blobData: BlobData
}

function Blob({ blobData }: BlobProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(blobData.position)
      // 球体が常にカメラの方を向くようにする
      groupRef.current.lookAt(0, 0, 12)
    }
  })

  return (
    <group ref={groupRef}>
      {/* メインの球体 - 透過なし */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[blobData.radius, 32, 32]} />
        <meshBasicMaterial 
          color={blobData.color} 
          transparent={false}
        />
      </mesh>
      
      {/* 目の表現 - すべての球体に目を付ける */}
      <>
        {/* 白目 */}
        <mesh position={[0, blobData.radius * 0.2, blobData.radius + 0.01]}>
          <circleGeometry args={[blobData.radius * 0.4, 16]} />
          <meshBasicMaterial 
            color="white" 
            side={THREE.FrontSide}
          />
        </mesh>
        {/* 瞳 */}
        <mesh position={[blobData.radius * 0.1, blobData.radius * 0.3, blobData.radius + 0.02]}>
          <circleGeometry args={[blobData.radius * 0.18, 16]} />
          <meshBasicMaterial 
            color="#1E40AF" 
            side={THREE.FrontSide}
          />
        </mesh>
      </>
    </group>
  )
}

// 物理シミュレーション
function usePhysics(blobs: BlobData[]) {
  useFrame((state, delta) => {
    const damping = 0.998
    const bounds = { x: 7, y: 3.5, z: 2.5 }
    const bounceRestitution = 0.7
    
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i]
      
      // 基本的な漂流力
      const driftForce = blob.driftDirection.clone().multiplyScalar(0.00005)
      blob.velocity.add(driftForce)
      
      // ランダムな微小な力
      const randomForce = new THREE.Vector3(
        (Math.random() - 0.5) * 0.00008,
        (Math.random() - 0.5) * 0.00008,
        (Math.random() - 0.5) * 0.00008
      )
      blob.velocity.add(randomForce)
      
      // 周期的な浮遊運動
      const time = state.clock.elapsedTime
      const floatForce = new THREE.Vector3(
        Math.sin(time * 0.4 + blob.id) * 0.00002,
        Math.cos(time * 0.3 + blob.id) * 0.00002,
        Math.sin(time * 0.5 + blob.id) * 0.00001
      )
      blob.velocity.add(floatForce)
      
      // 減衰を適用
      blob.velocity.multiplyScalar(damping)
      
      // 位置を更新
      const deltaTime = Math.min(delta, 1/30)
      blob.position.add(blob.velocity.clone().multiplyScalar(deltaTime * 60))
      
      // 境界での跳ね返り
      if (blob.position.x + blob.radius > bounds.x) {
        blob.position.x = bounds.x - blob.radius
        blob.velocity.x *= -bounceRestitution
      } else if (blob.position.x - blob.radius < -bounds.x) {
        blob.position.x = -bounds.x + blob.radius
        blob.velocity.x *= -bounceRestitution
      }
      
      if (blob.position.y + blob.radius > bounds.y) {
        blob.position.y = bounds.y - blob.radius
        blob.velocity.y *= -bounceRestitution
      } else if (blob.position.y - blob.radius < -bounds.y) {
        blob.position.y = -bounds.y + blob.radius
        blob.velocity.y *= -bounceRestitution
      }
      
      if (blob.position.z + blob.radius > bounds.z) {
        blob.position.z = bounds.z - blob.radius
        blob.velocity.z *= -bounceRestitution
      } else if (blob.position.z - blob.radius < -bounds.z) {
        blob.position.z = -bounds.z + blob.radius
        blob.velocity.z *= -bounceRestitution
      }
    }
    
    // 弱い反発力を適用（重なりを避ける）
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        if (checkCollision(blobs[i], blobs[j])) {
          applyRepulsion(blobs[i], blobs[j])
        }
      }
    }
  })
}

// メインコンポーネント
export default function FluidBlobs() {
  const blobs = useMemo(() => {
    const blobArray: BlobData[] = []
    const colors = Object.values(COLORS)
    
    for (let i = 0; i < 8; i++) { // 数を減らして見やすく
      const radius = 0.5 + Math.random() * 0.6
      blobArray.push({
        id: i,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015
        ),
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        mass: radius,
        driftDirection: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize()
      })
    }
    return blobArray
  }, [])

  // 物理シミュレーションコンポーネント
  function PhysicsSystem() {
    usePhysics(blobs)
    return null
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 65 }}
      style={{ width: '100%', height: '100%' }}
      dpr={Math.min(window.devicePixelRatio, 2)}
    >
      <PhysicsSystem />
      <ambientLight intensity={0.9} />
      
      {blobs.map((blob) => (
        <Blob key={blob.id} blobData={blob} />
      ))}
    </Canvas>
  )
}
