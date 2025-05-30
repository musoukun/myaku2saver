'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 球体の色定義
const COLORS = {
  CYAN: '#00CED1',
  MAGENTA: '#BA55D3', 
  BLUE: '#1E90FF'
}

// 物理プロパティを持つ球体の型定義
interface BlobData {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  radius: number
  color: string
  mass: number
  hasEyes: boolean
}

// 衝突検出関数
function checkCollision(blob1: BlobData, blob2: BlobData): boolean {
  const distance = blob1.position.distanceTo(blob2.position)
  return distance < (blob1.radius + blob2.radius)
}

// 衝突時の速度計算（弾性衝突）
function handleCollision(blob1: BlobData, blob2: BlobData) {
  const dx = blob2.position.x - blob1.position.x
  const dy = blob2.position.y - blob1.position.y
  const dz = blob2.position.z - blob1.position.z
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
  
  if (distance === 0) return // 同じ位置の場合は処理しない
  
  // 正規化された衝突ベクトル
  const nx = dx / distance
  const ny = dy / distance
  const nz = dz / distance
  
  // 相対速度
  const dvx = blob2.velocity.x - blob1.velocity.x
  const dvy = blob2.velocity.y - blob1.velocity.y
  const dvz = blob2.velocity.z - blob1.velocity.z
  
  // 法線方向の相対速度
  const dvn = dvx * nx + dvy * ny + dvz * nz
  
  if (dvn > 0) return // 球体が離れている場合
  
  // 反発係数（完全弾性衝突より少し小さく）
  const restitution = 0.7
  
  // 衝突後の速度計算
  const impulse = 2 * dvn / (blob1.mass + blob2.mass) * restitution
  
  blob1.velocity.x += impulse * blob2.mass * nx
  blob1.velocity.y += impulse * blob2.mass * ny
  blob1.velocity.z += impulse * blob2.mass * nz
  
  blob2.velocity.x -= impulse * blob1.mass * nx
  blob2.velocity.y -= impulse * blob1.mass * ny
  blob2.velocity.z -= impulse * blob1.mass * nz
  
  // 重なりを解消
  const overlap = (blob1.radius + blob2.radius) - distance
  const separationX = nx * overlap * 0.5
  const separationY = ny * overlap * 0.5
  const separationZ = nz * overlap * 0.5
  
  blob1.position.x -= separationX
  blob1.position.y -= separationY
  blob1.position.z -= separationZ
  
  blob2.position.x += separationX
  blob2.position.y += separationY
  blob2.position.z += separationZ
}

// 個別の球体コンポーネント
interface BlobProps {
  blobData: BlobData
}

function Blob({ blobData }: BlobProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(blobData.position)
      meshRef.current.scale.setScalar(blobData.radius)
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          ref={materialRef}
          color={blobData.color} 
          transparent 
          opacity={0.85} 
        />
      </mesh>
      
      {/* 目の表現 */}
      {blobData.hasEyes && (
        <>
          <mesh position={[blobData.position.x - blobData.radius * 0.3, blobData.position.y + blobData.radius * 0.2, blobData.position.z + blobData.radius * 0.8]}>
            <sphereGeometry args={[blobData.radius * 0.15, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh position={[blobData.position.x + blobData.radius * 0.3, blobData.position.y + blobData.radius * 0.2, blobData.position.z + blobData.radius * 0.8]}>
            <sphereGeometry args={[blobData.radius * 0.15, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
          {/* 瞳 */}
          <mesh position={[blobData.position.x - blobData.radius * 0.3, blobData.position.y + blobData.radius * 0.2, blobData.position.z + blobData.radius * 0.85]}>
            <sphereGeometry args={[blobData.radius * 0.08, 8, 8]} />
            <meshBasicMaterial color="black" />
          </mesh>
          <mesh position={[blobData.position.x + blobData.radius * 0.3, blobData.position.y + blobData.radius * 0.2, blobData.position.z + blobData.radius * 0.85]}>
            <sphereGeometry args={[blobData.radius * 0.08, 8, 8]} />
            <meshBasicMaterial color="black" />
          </mesh>
        </>
      )}
    </group>
  )
}

// 物理シミュレーション
function usePhysics(blobs: BlobData[]) {
  useFrame((state, delta) => {
    const gravity = new THREE.Vector3(0, -0.001, 0)
    const damping = 0.995 // 空気抵抗
    const bounds = { x: 8, y: 5, z: 4 }
    
    // 物理演算を適用
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i]
      
      // 重力を適用
      blob.velocity.add(gravity.clone().multiplyScalar(blob.mass))
      
      // ランダムな微小な力を追加（より自然な動き）
      const randomForce = new THREE.Vector3(
        (Math.random() - 0.5) * 0.0005,
        (Math.random() - 0.5) * 0.0005,
        (Math.random() - 0.5) * 0.0005
      )
      blob.velocity.add(randomForce)
      
      // 減衰を適用
      blob.velocity.multiplyScalar(damping)
      
      // 位置を更新
      blob.position.add(blob.velocity.clone().multiplyScalar(delta * 60))
      
      // 境界での反射
      if (blob.position.x > bounds.x || blob.position.x < -bounds.x) {
        blob.velocity.x *= -0.8
        blob.position.x = Math.max(-bounds.x, Math.min(bounds.x, blob.position.x))
      }
      if (blob.position.y > bounds.y || blob.position.y < -bounds.y) {
        blob.velocity.y *= -0.8
        blob.position.y = Math.max(-bounds.y, Math.min(bounds.y, blob.position.y))
      }
      if (blob.position.z > bounds.z || blob.position.z < -bounds.z) {
        blob.velocity.z *= -0.8
        blob.position.z = Math.max(-bounds.z, Math.min(bounds.z, blob.position.z))
      }
    }
    
    // 衝突検出と処理
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        if (checkCollision(blobs[i], blobs[j])) {
          handleCollision(blobs[i], blobs[j])
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
    
    for (let i = 0; i < 12; i++) {
      const radius = 0.3 + Math.random() * 0.7
      blobArray.push({
        id: i,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        ),
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        mass: radius * radius, // 質量は半径の2乗に比例
        hasEyes: Math.random() < 0.3 // 30%の確率で目を持つ
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
      camera={{ position: [0, 0, 12], fov: 60 }}
      style={{ width: '100%', height: '100%' }}
      dpr={window.devicePixelRatio}
    >
      <PhysicsSystem />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.3} />
      
      {blobs.map((blob) => (
        <Blob key={blob.id} blobData={blob} />
      ))}
    </Canvas>
  )
}
