'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PupilProps {
  radius: number
  opacity: number
  scale: number
  position: [number, number, number]
}

export default function Pupil({ radius, opacity, scale, position }: PupilProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(...position)
    }
    if (materialRef.current) {
      materialRef.current.opacity = opacity
      materialRef.current.transparent = opacity < 1
    }
  })

  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[radius, 16]} />
      <meshBasicMaterial 
        ref={materialRef}
        color="#1E40AF" 
        side={THREE.FrontSide}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}
