/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SimpleMetaballProps {
	// 分裂の進行度 (0 = 合体状態, 1 = 完全分離)
	progress: number;
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

export default function SimpleMetaball({
	progress,
	radius,
	color,
	opacity,
	visible,
	direction,
}: SimpleMetaballProps) {
	const groupRef = useRef<THREE.Group>(null);
	const sphere1Ref = useRef<THREE.Mesh>(null);
	const sphere2Ref = useRef<THREE.Mesh>(null);
	const connectingMeshRef = useRef<THREE.Mesh>(null);
	const centerConnectRef = useRef<THREE.Mesh>(null);
	const bridge1Ref = useRef<THREE.Mesh>(null);
	const bridge2Ref = useRef<THREE.Mesh>(null);

	useFrame(() => {
		if (
			!groupRef.current ||
			!sphere1Ref.current ||
			!sphere2Ref.current ||
			!connectingMeshRef.current ||
			!centerConnectRef.current ||
			!bridge1Ref.current ||
			!bridge2Ref.current
		)
			return;

		// 分裂の進行度に応じて2つの球体の位置を計算
		const separationDistance = progress * radius * 3;
		const direction1 = direction
			.clone()
			.multiplyScalar(separationDistance * 0.5);
		const direction2 = direction
			.clone()
			.multiplyScalar(-separationDistance * 0.5);

		// 球体の位置を設定
		sphere1Ref.current.position.copy(direction1);
		sphere2Ref.current.position.copy(direction2);

		// 球体のサイズ調整（分裂が進むにつれて小さくなる）
		const sphereScale = Math.max(0.3, 1 - progress * 0.4);
		sphere1Ref.current.scale.setScalar(sphereScale);
		sphere2Ref.current.scale.setScalar(sphereScale);

		// 接続部分（メタボール効果を模擬）
		if (progress > 0.1 && progress < 0.9) {
			connectingMeshRef.current.visible = true;

			// 接続部分の位置（2つの球体の中間）
			connectingMeshRef.current.position.set(0, 0, 0);

			// 接続部分のスケール（プログレスに応じて変化）
			// プログレスが0.5の時に最大になるシングルピーク曲線
			const peakProgress = Math.sin(progress * Math.PI); // 0〜1の間で山型曲線
			const connectScale = peakProgress * 0.6;

			// 分裂方向に引き伸ばす効果
			const stretchScale = 1 + progress * 3; // 分裂方向に伸ばす

			// 方向に応じて異方性スケーリング
			const normalizedDir = direction.clone().normalize();
			connectingMeshRef.current.scale.set(
				connectScale +
					Math.abs(normalizedDir.x) * (stretchScale - 1) * 0.3,
				connectScale +
					Math.abs(normalizedDir.y) * (stretchScale - 1) * 0.3,
				connectScale +
					Math.abs(normalizedDir.z) * (stretchScale - 1) * 0.3
			);

			// 接続部分の透明度
			const connectOpacity = peakProgress * opacity * 0.8;
			if (
				connectingMeshRef.current.material instanceof
				THREE.MeshBasicMaterial
			) {
				connectingMeshRef.current.material.opacity = connectOpacity;
			}
		} else {
			connectingMeshRef.current.visible = false;
		}

		// 中央の接続部分（早い段階で消える）
		if (progress > 0.05 && progress < 0.6) {
			centerConnectRef.current.visible = true;
			const centerScale = (1 - progress * 1.5) * 0.9;
			centerConnectRef.current.scale.setScalar(Math.max(0, centerScale));

			const centerOpacity = (1 - progress * 1.5) * opacity * 0.9;
			if (
				centerConnectRef.current.material instanceof
				THREE.MeshBasicMaterial
			) {
				centerConnectRef.current.material.opacity = Math.max(
					0,
					centerOpacity
				);
			}
		} else {
			centerConnectRef.current.visible = false;
		}

		// ブリッジ接続部分（中期段階）
		if (progress > 0.2 && progress < 0.8) {
			const bridgeProgress = (progress - 0.2) / 0.6; // 0.2-0.8を0-1に正規化
			const bridgeScale = Math.sin(bridgeProgress * Math.PI) * 0.4;
			const bridgeOffset = separationDistance * 0.25;

			// ブリッジ1（球体1寄り）
			bridge1Ref.current.visible = true;
			bridge1Ref.current.position.copy(
				direction1.clone().multiplyScalar(0.5)
			);
			bridge1Ref.current.scale.setScalar(bridgeScale);

			// ブリッジ2（球体2寄り）
			bridge2Ref.current.visible = true;
			bridge2Ref.current.position.copy(
				direction2.clone().multiplyScalar(0.5)
			);
			bridge2Ref.current.scale.setScalar(bridgeScale);

			const bridgeOpacity = bridgeScale * opacity * 0.6;
			if (
				bridge1Ref.current.material instanceof THREE.MeshBasicMaterial
			) {
				bridge1Ref.current.material.opacity = bridgeOpacity;
			}
			if (
				bridge2Ref.current.material instanceof THREE.MeshBasicMaterial
			) {
				bridge2Ref.current.material.opacity = bridgeOpacity;
			}
		} else {
			bridge1Ref.current.visible = false;
			bridge2Ref.current.visible = false;
		}

		// 全体の可視性
		groupRef.current.visible = visible;
	});

	// マテリアルの作成
	const sphereMaterial = new THREE.MeshBasicMaterial({
		color: color,
		transparent: true,
		opacity: opacity,
	});

	const connectMaterial = new THREE.MeshBasicMaterial({
		color: color,
		transparent: true,
		opacity: opacity * 0.7,
	});

	return (
		<group ref={groupRef}>
			{/* 球体1 */}
			<mesh ref={sphere1Ref} material={sphereMaterial}>
				<sphereGeometry args={[radius, 16, 16]} />
			</mesh>

			{/* 球体2 */}
			<mesh ref={sphere2Ref} material={sphereMaterial}>
				<sphereGeometry args={[radius, 16, 16]} />
			</mesh>

			{/* 中央の接続部分（最初に消える） */}
			<mesh ref={centerConnectRef} material={connectMaterial}>
				<sphereGeometry args={[radius * 1.0, 12, 12]} />
			</mesh>

			{/* メインの接続部分（メタボール効果） */}
			<mesh ref={connectingMeshRef} material={connectMaterial}>
				<sphereGeometry args={[radius * 0.8, 12, 12]} />
			</mesh>

			{/* ブリッジ接続部吆1*/}
			<mesh ref={bridge1Ref} material={connectMaterial}>
				<sphereGeometry args={[radius * 0.6, 10, 10]} />
			</mesh>

			{/* ブリッジ接続部吆2 */}
			<mesh ref={bridge2Ref} material={connectMaterial}>
				<sphereGeometry args={[radius * 0.6, 10, 10]} />
			</mesh>
		</group>
	);
}
