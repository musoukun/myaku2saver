"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MetaballSplitProps {
  // 分裂の進行度 (0 = 合体状態, 1 = 完全分離)
  progress: number;
  // 2つの球体の中心間の距離
  separation: number;
  // 球体の半径
  radius: number;
  // 色
  color: string;
  // 透明度
  opacity: number;
  // 表示フラグ
  visible: boolean;
  // 分裂方向
  direction: THREE.Vector3;
}

export default function MetaballSplit({
  progress,
  separation,
  radius,
  color,
  opacity,
  visible,
  direction
}: MetaballSplitProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // メタボール効果を表現するカスタムジオメトリを作成
  const geometry = useMemo(() => {
    const segments = 32;
    const geometry = new THREE.SphereGeometry(1, segments, segments);
    
    return geometry;
  }, []);

  // カスタムシェーダーマテリアル（メタボール効果）
  const material = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        uniform float uProgress;
        uniform float uSeparation;
        uniform vec3 uDirection;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          
          // 分裂進行度に応じて形状を変形
          float separationFactor = uProgress * uSeparation;
          
          // 2つの球体の中心位置を計算
          vec3 center1 = uDirection * separationFactor * 0.5;
          vec3 center2 = -uDirection * separationFactor * 0.5;
          
          // 各頂点から2つの中心への距離を計算
          float dist1 = length(pos - center1);
          float dist2 = length(pos - center2);
          
          // メタボール効果: 近い方の中心に向かって引き寄せる
          float influence1 = 1.0 / (1.0 + dist1 * dist1);
          float influence2 = 1.0 / (1.0 + dist2 * dist2);
          
          // 分裂進行度に応じて影響を調整
          float blendFactor = smoothstep(0.0, 1.0, uProgress);
          
          // 頂点位置を調整してメタボール効果を作成
          vec3 influence = normalize(
            center1 * influence1 + center2 * influence2
          ) * blendFactor;
          
          pos += influence * 0.3;
          
          // 分裂の進行に応じて伸縮
          if (uProgress > 0.0) {
            float stretchFactor = 1.0 + uProgress * 2.0;
            float dotProduct = dot(normalize(pos), uDirection);
            pos += uDirection * dotProduct * (stretchFactor - 1.0) * 0.5;
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uProgress;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // 基本的なライティング
          vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
          float lightIntensity = max(0.3, dot(vNormal, lightDirection));
          
          vec3 finalColor = uColor * lightIntensity;
          
          // 分裂エフェクトによる透明度調整
          float alpha = uOpacity * (1.0 - uProgress * 0.3);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      uniforms: {
        uProgress: { value: 0 },
        uSeparation: { value: 1 },
        uDirection: { value: new THREE.Vector3(1, 0, 0) },
        uColor: { value: new THREE.Color('#ffffff') },
        uOpacity: { value: 1.0 }
      }
    });
    
    return material;
  }, []);

  useFrame(() => {
    if (meshRef.current && material) {
      // ユニフォームを更新
      material.uniforms.uProgress.value = progress;
      material.uniforms.uSeparation.value = separation;
      material.uniforms.uDirection.value.copy(direction.clone().normalize());
      material.uniforms.uColor.value.set(color);
      material.uniforms.uOpacity.value = opacity;
      
      // スケール調整
      const scale = radius * (1 + progress * 0.5);
      meshRef.current.scale.setScalar(scale);
      meshRef.current.visible = visible;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}
