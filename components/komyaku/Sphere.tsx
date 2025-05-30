'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SphereProps {
  radius: number
  color: string
  opacity: number
  scale: number
  position?: [number, number, number]
  visible?: boolean
}

export default function Sphere({ 
  radius, 
  color, 
  opacity, 
  scale, 
  position = [0, 0, 0], 
  visible = true 
}: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(...position)
      meshRef.current.visible = visible
    }
    if (materialRef.current) {
      materialRef.current.opacity = opacity
      materialRef.current.transparent = opacity < 1
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshBasicMaterial 
        ref={materialRef}
        color={color} 
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}
