/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SphereProps {
	radius: number;
	color: string;
	opacity: number;
	scale: number;
	position?: [number, number, number];
	visible?: boolean;
	// メタボール効果用の変形パラメータ
	stretchDirection?: THREE.Vector3;
	stretchAmount?: number;
}

export default function Sphere({
	radius,
	color,
	opacity,
	scale,
	position = [0, 0, 0],
	visible = true,
	stretchDirection,
	stretchAmount = 0,
}: SphereProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.MeshBasicMaterial>(null);

	useFrame(() => {
		if (meshRef.current) {
			// メタボール効果：分裂方向に引き伸ばす
			if (stretchDirection && stretchAmount > 0) {
				// 分裂方向に引き伸ばすスケールを計算
				const stretchScale = 1 + stretchAmount * 2; // 最大3倍まで引き伸ばす
				const perpScale = 1 - stretchAmount * 0.3; // 垂直方向は少し縮む

				// 方向ベクトルを正規化
				const normalizedDirection = stretchDirection
					.clone()
					.normalize();

				// X, Y, Z軸での引き伸ばし量を計算
				const scaleX =
					1 + (stretchScale - 1) * Math.abs(normalizedDirection.x);
				const scaleY =
					1 + (stretchScale - 1) * Math.abs(normalizedDirection.y);
				const scaleZ =
					1 + (stretchScale - 1) * Math.abs(normalizedDirection.z);

				meshRef.current.scale.set(
					scaleX * scale,
					scaleY * scale,
					scaleZ * scale
				);
			} else {
				meshRef.current.scale.setScalar(scale);
			}

			meshRef.current.position.set(...position);
			meshRef.current.visible = visible;
		}
		if (materialRef.current) {
			materialRef.current.opacity = opacity;
			materialRef.current.transparent = opacity < 1;
		}
	});

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
	);
}
