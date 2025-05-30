"use client";

import React, { useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Komyaku from "./komyaku/Komyaku";
import { KomyakuData, COLORS, INITIAL_KOMYAKU_COUNT } from "./komyaku/types";
import { updatePhysics } from "./komyaku/physics";

// 物理シミュレーション
function usePhysics(
	komyakus: KomyakuData[],
	setKomyakus: React.Dispatch<React.SetStateAction<KomyakuData[]>>
) {
	useFrame((state, delta) => {
		const newKomyakus = updatePhysics(
			komyakus,
			delta,
			state.clock.elapsedTime
		);

		if (
			newKomyakus.length !== komyakus.length ||
			newKomyakus.some(
				(komyaku) => komyaku.isDying || komyaku.isSplitting
			)
		) {
			setKomyakus([...newKomyakus]);
		}
	});
}

// メインコンポーネント
export default function FluidBlobs() {
	const [komyakus, setKomyakus] = useState<KomyakuData[]>(() => {
		const komyakuArray: KomyakuData[] = [];
		const colors = Object.values(COLORS);

		for (let i = 0; i < INITIAL_KOMYAKU_COUNT; i++) {
			const radius = 0.6 + Math.random() * 0.5;
			komyakuArray.push({
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
				originalRadius: radius,
				color: colors[Math.floor(Math.random() * colors.length)],
				mass: radius,
				driftDirection: new THREE.Vector3(
					(Math.random() - 0.5) * 2,
					(Math.random() - 0.5) * 2,
					(Math.random() - 0.5) * 2
				).normalize(),
				eyePhase: Math.random() * Math.PI * 2,
				age: 0,
				canSplit: true,
				isSplitting: false,
				splitProgress: 0,
				splitDirection: new THREE.Vector3(),
				isDying: false,
				deathProgress: 0,
				opacity: 1,
				childSphere1Offset: new THREE.Vector3(),
				childSphere2Offset: new THREE.Vector3(),
			});
		}
		return komyakuArray;
	});

	function PhysicsSystem() {
		usePhysics(komyakus, setKomyakus);
		return null;
	}

	return (
		<Canvas
			camera={{ position: [0, 0, 12], fov: 65 }}
			style={{
				width: "100%",
				height: "100%",
				backgroundColor: "#000000",
			}}
			dpr={Math.min(window.devicePixelRatio, 2)}
			gl={{ alpha: false, antialias: true }}
		>
			<PhysicsSystem />
			<ambientLight intensity={0.9} />

			{/* メタボール背景を無効化 */}
			{/* <MetaballBackground komyakus={komyakus} /> */}

			{/* 通常のkomyakuメッシュ（目を含む） */}
			{komyakus.map((komyaku) => (
				<Komyaku
					key={komyaku.id}
					komyakuData={komyaku}
					showMesh={true}
				/>
			))}
		</Canvas>
	);
}
