"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Sphere from "./Sphere";
import WhiteEye from "./WhiteEye";
import Pupil from "./Pupil";
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
			groupRef.current.lookAt(0, 0, 12);
		}

		// 分裂アニメーション
		if (komyakuData.isSplitting) {
			const progress = komyakuData.splitProgress;

			const separationDistance =
				progress * komyakuData.originalRadius * 1.5;
			komyakuData.childSphere1Offset
				.copy(komyakuData.splitDirection)
				.multiplyScalar(separationDistance);
			komyakuData.childSphere2Offset
				.copy(komyakuData.splitDirection)
				.multiplyScalar(-separationDistance);

			setChildSphere1Visible(true);
			setChildSphere2Visible(true);
			setChildSphere1Scale(progress);
			setChildSphere2Scale(progress);
			setChildSphere1Opacity(progress);
			setChildSphere2Opacity(progress);

			setEyeOpacity(1 - progress);
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
	const mainSphereOpacity = komyakuData.isSplitting
		? 1 - komyakuData.splitProgress
		: komyakuData.isDying
			? 1 - komyakuData.deathProgress
			: 1.0; // 常に不透明
	const mainSphereScale = komyakuData.isDying
		? 1 - komyakuData.deathProgress
		: 1;

	return (
		<group ref={groupRef}>
			{/* メインの球体 */}
			<Sphere
				radius={komyakuData.radius}
				color={komyakuData.color}
				opacity={mainSphereOpacity}
				scale={mainSphereScale}
			/>

			{/* 分裂時の子球体1 */}
			<Sphere
				radius={childRadius}
				color={komyakuData.color}
				opacity={childSphere1Opacity}
				scale={childSphere1Scale}
				position={[
					komyakuData.childSphere1Offset.x,
					komyakuData.childSphere1Offset.y,
					komyakuData.childSphere1Offset.z,
				]}
				visible={childSphere1Visible}
			/>

			{/* 分裂時の子球体2 */}
			<Sphere
				radius={childRadius}
				color={colors[Math.floor(Math.random() * colors.length)]}
				opacity={childSphere2Opacity}
				scale={childSphere2Scale}
				position={[
					komyakuData.childSphere2Offset.x,
					komyakuData.childSphere2Offset.y,
					komyakuData.childSphere2Offset.z,
				]}
				visible={childSphere2Visible}
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
		</group>
	);
}
