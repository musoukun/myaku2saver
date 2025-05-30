/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Sphere from "./Sphere";
import WhiteEye from "./WhiteEye";
import Pupil from "./Pupil";
import SimpleMetaball from "./SimpleMetaball";
import { KomyakuData } from "./types";

// 球体の色定義
const COLORS = {
	CYAN: "#4ECDC4",
	MAGENTA: "#E06B9A",
	BLUE: "#4A90E2",
	RED: "#E74C3C",
};

interface KomyakuProps {
	komyakuData: KomyakuData;
	showMesh: boolean; // メタボール表示時は通常のメッシュを薄く
}

export default function Komyaku({ komyakuData }: KomyakuProps) {
	const groupRef = useRef<THREE.Group>(null);

	// 目の位置とスケールの状態
	const [whiteEyePosition, setWhiteEyePosition] = useState<
		[number, number, number]
	>([0, 0, 0]);
	const [pupilPosition, setPupilPosition] = useState<
		[number, number, number]
	>([0, 0, 0]);
	const [eyeScale, setEyeScale] = useState(1);
	const [eyeOpacity, setEyeOpacity] = useState(1);

	// 分裂用の子球体の状態
	const [childSphere1Visible, setChildSphere1Visible] = useState(false);
	const [childSphere2Visible, setChildSphere2Visible] = useState(false);
	const [childSphere1Scale, setChildSphere1Scale] = useState(0);
	const [childSphere2Scale, setChildSphere2Scale] = useState(0);
	const [childSphere1Opacity, setChildSphere1Opacity] = useState(0);
	const [childSphere2Opacity, setChildSphere2Opacity] = useState(0);

	useFrame((state) => {
		if (groupRef.current) {
			groupRef.current.position.copy(komyakuData.position);
			// 分裂時はメタボールが位置を制御するので、メインの位置をリセット
			if (!komyakuData.isSplitting) {
				groupRef.current.lookAt(0, 0, 12);
			}
		}

		// 分裂アニメーション
		if (komyakuData.isSplitting) {
			const progress = komyakuData.splitProgress;

			// 分裂が50%進行したら子球体を表示開始
			const childStartThreshold = 0.5;
			const separationDistance =
				progress * komyakuData.originalRadius * 1.5;
			komyakuData.childSphere1Offset
				.copy(komyakuData.splitDirection)
				.multiplyScalar(separationDistance);
			komyakuData.childSphere2Offset
				.copy(komyakuData.splitDirection)
				.multiplyScalar(-separationDistance);

			if (progress > childStartThreshold) {
				const childProgress =
					(progress - childStartThreshold) /
					(1 - childStartThreshold);
				setChildSphere1Visible(true);
				setChildSphere2Visible(true);
				setChildSphere1Scale(childProgress);
				setChildSphere2Scale(childProgress);
				setChildSphere1Opacity(childProgress);
				setChildSphere2Opacity(childProgress);
			} else {
				setChildSphere1Visible(false);
				setChildSphere2Visible(false);
			}

			// メインの球体の透明度は80%進行したら消え始める
			const fadeStartThreshold = 0.8;
			if (progress > fadeStartThreshold) {
				const fadeProgress =
					(progress - fadeStartThreshold) / (1 - fadeStartThreshold);
				setEyeOpacity(1 - fadeProgress);
			} else {
				setEyeOpacity(1);
			}
		} else {
			setChildSphere1Visible(false);
			setChildSphere2Visible(false);
		}

		// 消滅アニメーション
		if (komyakuData.isDying) {
			const scale = 1 - komyakuData.deathProgress;
			const opacity = 1 - komyakuData.deathProgress;
			setEyeScale(scale);
			setEyeOpacity(opacity);
		} else if (!komyakuData.isSplitting) {
			setEyeScale(1);
			setEyeOpacity(komyakuData.opacity);
		}

		// 目のアニメーション
		const time = state.clock.elapsedTime;
		const eyeSpeed = 0.8;
		const eyePhase = time * eyeSpeed + komyakuData.eyePhase;

		// 白目の動き
		const whiteEyeAngle = eyePhase;
		const whiteEyeRadius = komyakuData.radius * 0.3;
		const whiteEyeX = Math.cos(whiteEyeAngle) * whiteEyeRadius;
		const whiteEyeY =
			komyakuData.radius * 0.2 +
			Math.sin(whiteEyeAngle) * whiteEyeRadius * 0.5;
		const whiteEyeZ = komyakuData.radius + 0.01;

		// 黒目の動き
		const pupilDelay = 0.5;
		const pupilAngle = eyePhase - pupilDelay;
		const pupilRadius = komyakuData.radius * 0.15;
		const pupilX = whiteEyeX + Math.cos(pupilAngle) * pupilRadius;
		const pupilY = whiteEyeY + Math.sin(pupilAngle) * pupilRadius * 0.3;
		const pupilZ = komyakuData.radius + 0.02;

		setWhiteEyePosition([whiteEyeX, whiteEyeY, whiteEyeZ]);
		setPupilPosition([pupilX, pupilY, pupilZ]);
	});

	const colors = Object.values(COLORS);
	const childRadius = komyakuData.originalRadius * 0.7;
	// パルスエフェクトの計算（一瞬大きくなって元に戻る）
	const pulseScale = komyakuData.isPulsing
		? 1 + Math.sin(komyakuData.pulseProgress * Math.PI) * 0.5 // 0から1の間でサイン波、最大1.5倍に
		: 1;

	const mainSphereOpacity = komyakuData.isSplitting
		? komyakuData.splitProgress > 0.8
			? 1 - (komyakuData.splitProgress - 0.8) / 0.2 // 80%で消え始める
			: 1
		: komyakuData.isDying
			? 1 - komyakuData.deathProgress
			: 1.0; // 常に不透明
	const mainSphereScale = komyakuData.isDying
		? (1 - komyakuData.deathProgress) * pulseScale
		: pulseScale;

	return (
		<group ref={groupRef}>
			{komyakuData.isSplitting ? (
				// 分裂時はメタボールエフェクトを使用
				<SimpleMetaball
					progress={komyakuData.splitProgress}
					radius={komyakuData.radius}
					color={komyakuData.color}
					opacity={mainSphereOpacity}
					visible={true}
					direction={komyakuData.splitDirection}
				/>
			) : (
				// 通常時は従来の球体
				<>
					<Sphere
						radius={komyakuData.radius}
						color={komyakuData.color}
						opacity={mainSphereOpacity}
						scale={mainSphereScale}
					/>

					{/* 白目 */}
					<WhiteEye
						radius={komyakuData.radius * 0.4}
						opacity={eyeOpacity}
						scale={eyeScale}
						position={whiteEyePosition}
					/>

					{/* 黒目 */}
					<Pupil
						radius={komyakuData.radius * 0.18}
						opacity={eyeOpacity}
						scale={eyeScale}
						position={pupilPosition}
					/>
				</>
			)}
		</group>
	);
}
