'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { KomyakuData, MAX_KOMYAKU_COUNT } from './types'

// メタボール用のシェーダー
const metaballVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const metaballFragmentShader = `
  precision highp float;
  
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_spheres[${MAX_KOMYAKU_COUNT}];
  uniform vec3 u_colors[${MAX_KOMYAKU_COUNT}];
  uniform int u_sphereCount;
  
  varying vec2 vUv;
  
  void main() {
    vec2 st = (vUv - 0.5) * 2.0;
    st.x *= u_resolution.x / u_resolution.y;
    
    float metaball = 0.0;
    vec3 color = vec3(0.0);
    
    for(int i = 0; i < ${MAX_KOMYAKU_COUNT}; i++) {
      if(i >= u_sphereCount) break;
      
      vec2 spherePos = u_spheres[i].xy;
      float radius = u_spheres[i].z;
      
      float dist = distance(st, spherePos);
      float influence = radius / (dist + 0.1);
      
      metaball += influence;
      color += u_colors[i] * influence;
    }
    
    // メタボールの閾値
    float threshold = 1.5;
    
    if(metaball > threshold) {
      color = color / metaball;
      float alpha = smoothstep(threshold, threshold * 1.5, metaball);
      gl_FragColor = vec4(color, alpha * 0.6);
    } else {
      discard;
    }
  }
`

interface MetaballBackgroundProps {
  komyakus: KomyakuData[]
}

export default function MetaballBackground({ komyakus }: MetaballBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()

  const uniforms = useMemo(() => ({
    u_time: { value: 0.0 },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    u_spheres: { value: new Array(MAX_KOMYAKU_COUNT).fill(new THREE.Vector3()) },
    u_colors: { value: new Array(MAX_KOMYAKU_COUNT).fill(new THREE.Vector3()) },
    u_sphereCount: { value: 0 }
  }), [size])

  useFrame((state) => {
    if (materialRef.current) {
      // 時間を更新
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime

      // 解像度を更新
      materialRef.current.uniforms.u_resolution.value.set(size.width, size.height)

      // komyakuの位置とサイズを更新
      const spheres = []
      const colors = []
      
      for (let i = 0; i < MAX_KOMYAKU_COUNT; i++) {
        if (i < komyakus.length) {
          const komyaku = komyakus[i]
          
          // 3D座標を2D座標に変換（簡易投影）
          const x = komyaku.position.x / 6 // 境界に合わせてスケール
          const y = komyaku.position.y / 4
          
          // メタボール効果の強度を半径に基づいて設定
          const metaRadius = komyaku.radius * 0.8
          
          spheres.push(new THREE.Vector3(x, y, metaRadius))
          
          // 色をRGBベクトルに変換
          const color = new THREE.Color(komyaku.color)
          colors.push(new THREE.Vector3(color.r, color.g, color.b))
        } else {
          spheres.push(new THREE.Vector3(0, 0, 0))
          colors.push(new THREE.Vector3(0, 0, 0))
        }
      }

      materialRef.current.uniforms.u_spheres.value = spheres
      materialRef.current.uniforms.u_colors.value = colors
      materialRef.current.uniforms.u_sphereCount.value = komyakus.length
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0.5]}>
      <planeGeometry args={[16, 12]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={metaballVertexShader}
        fragmentShader={metaballFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}
