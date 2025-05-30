"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 球体の色定義
const COLORS = {
	CYAN: "#4ECDC4",
	MAGENTA: "#E06B9A",
	BLUE: "#4A90E2",
	RED: "#E74C3C",
};

// komyakuの物理プロパティ
interface KomyakuData {
	id: number;
	position: THREE.Vector3;
	velocity: THREE.Vector3;
	radius: number;
	originalRadius: number;
	color: string;
	mass: number;
	driftDirection: THREE.Vector3;
	eyePhase: number;
	age: number;
	canSplit: boolean;
	isSplitting: boolean;
	splitProgress: number;
	splitDirection: THREE.Vector3;
	isDying: boolean;
	deathProgress: number;
	opacity: number;
	childSphere1Offset: THREE.Vector3;
	childSphere2Offset: THREE.Vector3;
}

let nextId = 100;
const INITIAL_KOMYAKU_COUNT = 6;
const MAX_KOMYAKU_COUNT = 15;
const DEATH_TRIGGER_COUNT = INITIAL_KOMYAKU_COUNT + 5;

// 球体コンポーネント
interface SphereProps {
	radius: number;
	color: string;
	opacity: number;
	scale: number;
	position?: [number, number, number];
	visible?: boolean;
}

function Sphere({
	radius,
	color,
	opacity,
	scale,
	position = [0, 0, 0],
	visible = true,
}: SphereProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.MeshBasicMaterial>(null);

	useFrame(() => {
		if (meshRef.current) {
			meshRef.current.scale.setScalar(scale);
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

// 白目コンポーネント
interface WhiteEyeProps {
	radius: number;
	opacity: number;
	scale: number;
	position: [number, number, number];
}

function WhiteEye({ radius, opacity, scale, position }: WhiteEyeProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.MeshBasicMaterial>(null);

	useFrame(() => {
		if (meshRef.current) {
			meshRef.current.scale.setScalar(scale);
			meshRef.current.position.set(...position);
		}
		if (materialRef.current) {
			materialRef.current.opacity = opacity;
			materialRef.current.transparent = opacity < 1;
		}
	});

	return (
		<mesh ref={meshRef}>
			<circleGeometry args={[radius, 16]} />
			<meshBasicMaterial
				ref={materialRef}
				color="white"
				side={THREE.FrontSide}
				transparent={opacity < 1}
				opacity={opacity}
			/>
		</mesh>
	);
}

// 黒目コンポーネント
interface PupilProps {
	radius: number;
	opacity: number;
	scale: number;
	position: [number, number, number];
}

function Pupil({ radius, opacity, scale, position }: PupilProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.MeshBasicMaterial>(null);

	useFrame(() => {
		if (meshRef.current) {
			meshRef.current.scale.setScalar(scale);
			meshRef.current.position.set(...position);
		}
		if (materialRef.current) {
			materialRef.current.opacity = opacity;
			materialRef.current.transparent = opacity < 1;
		}
	});

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
	);
}

// komyakuコンポーネント（球体+白目+黒目の統合）
interface KomyakuProps {
	komyakuData: KomyakuData;
}

function Komyaku({ komyakuData }: KomyakuProps) {
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
			const childRadius = komyakuData.originalRadius * 0.7;

			// 分裂方向に子球体を移動
			const separationDistance =
				progress * komyakuData.originalRadius * 1.5;
			komyakuData.childSphere1Offset
				.copy(komyakuData.splitDirection)
				.multiplyScalar(separationDistance);
			komyakuData.childSphere2Offset
				.copy(komyakuData.splitDirection)
				.multiplyScalar(-separationDistance);

			// 子球体の状態を更新
			setChildSphere1Visible(true);
			setChildSphere2Visible(true);
			setChildSphere1Scale(progress);
			setChildSphere2Scale(progress);
			setChildSphere1Opacity(progress);
			setChildSphere2Opacity(progress);

			// 元の球体と目の透明度を下げる
			setEyeOpacity(1 - progress);
		} else {
			// 分裂していない時は子球体を非表示
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
			// 通常状態ではスケールと透明度をリセット
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
			: komyakuData.opacity;
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

// 衝突検出関数
function checkCollision(komyaku1: KomyakuData, komyaku2: KomyakuData): boolean {
	const distance = komyaku1.position.distanceTo(komyaku2.position);
	return distance < (komyaku1.radius + komyaku2.radius) * 1.2;
}

// 弱い反発力の計算
function applyRepulsion(komyaku1: KomyakuData, komyaku2: KomyakuData) {
	const dx = komyaku2.position.x - komyaku1.position.x;
	const dy = komyaku2.position.y - komyaku1.position.y;
	const dz = komyaku2.position.z - komyaku1.position.z;
	const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

	if (distance === 0) return;

	const nx = dx / distance;
	const ny = dy / distance;
	const nz = dz / distance;

	const repulsionStrength = 0.00005;
	const force = repulsionStrength / (distance * distance);

	komyaku1.velocity.x -= nx * force;
	komyaku1.velocity.y -= ny * force;
	komyaku1.velocity.z -= nz * force;

	komyaku2.velocity.x += nx * force;
	komyaku2.velocity.y += ny * force;
	komyaku2.velocity.z += nz * force;
}

// 分裂処理
function createSplitKomyaku(originalKomyaku: KomyakuData): KomyakuData[] {
	const newRadius = originalKomyaku.originalRadius * 0.7;
	const colors = Object.values(COLORS);

	const komyaku1: KomyakuData = {
		id: nextId++,
		position: originalKomyaku.position
			.clone()
			.add(originalKomyaku.childSphere1Offset),
		velocity: originalKomyaku.velocity
			.clone()
			.add(originalKomyaku.splitDirection.clone().multiplyScalar(0.02)),
		radius: newRadius,
		originalRadius: newRadius,
		color: originalKomyaku.color,
		mass: newRadius,
		driftDirection: new THREE.Vector3(
			(Math.random() - 0.5) * 2,
			(Math.random() - 0.5) * 2,
			(Math.random() - 0.5) * 2
		).normalize(),
		eyePhase: Math.random() * Math.PI * 2,
		age: 0,
		canSplit: newRadius > 0.3,
		isSplitting: false,
		splitProgress: 0,
		splitDirection: new THREE.Vector3(),
		isDying: false,
		deathProgress: 0,
		opacity: 1,
		childSphere1Offset: new THREE.Vector3(),
		childSphere2Offset: new THREE.Vector3(),
	};

	const komyaku2: KomyakuData = {
		id: nextId++,
		position: originalKomyaku.position
			.clone()
			.add(originalKomyaku.childSphere2Offset),
		velocity: originalKomyaku.velocity
			.clone()
			.add(originalKomyaku.splitDirection.clone().multiplyScalar(-0.02)),
		radius: newRadius,
		originalRadius: newRadius,
		color: colors[Math.floor(Math.random() * colors.length)],
		mass: newRadius,
		driftDirection: new THREE.Vector3(
			(Math.random() - 0.5) * 2,
			(Math.random() - 0.5) * 2,
			(Math.random() - 0.5) * 2
		).normalize(),
		eyePhase: Math.random() * Math.PI * 2,
		age: 0,
		canSplit: newRadius > 0.3,
		isSplitting: false,
		splitProgress: 0,
		splitDirection: new THREE.Vector3(),
		isDying: false,
		deathProgress: 0,
		opacity: 1,
		childSphere1Offset: new THREE.Vector3(),
		childSphere2Offset: new THREE.Vector3(),
	};

	return [komyaku1, komyaku2];
}

// 物理シミュレーション
function usePhysics(
	komyakus: KomyakuData[],
	setKomyakus: React.Dispatch<React.SetStateAction<KomyakuData[]>>
) {
	useFrame((state, delta) => {
		const damping = 0.998;
		const bounds = { x: 7, y: 3.5, z: 2.5 };
		const bounceRestitution = 0.7;

		const newKomyakus: KomyakuData[] = [];
		const shouldTriggerDeath = komyakus.length >= DEATH_TRIGGER_COUNT;

		for (let i = 0; i < komyakus.length; i++) {
			const komyaku = komyakus[i];

			komyaku.age += delta;

			// 消滅判定
			if (
				!komyaku.isDying &&
				!komyaku.isSplitting &&
				shouldTriggerDeath &&
				Math.random() < 0.002
			) {
				komyaku.isDying = true;
				komyaku.deathProgress = 0;
			}

			// 消滅アニメーション進行
			if (komyaku.isDying) {
				komyaku.deathProgress += delta * 0.8;

				if (komyaku.deathProgress >= 1) {
					continue;
				}
			}

			// 分裂判定
			if (
				!komyaku.isSplitting &&
				!komyaku.isDying &&
				komyaku.canSplit &&
				komyaku.age > 5 &&
				Math.random() < 0.001
			) {
				komyaku.isSplitting = true;
				komyaku.splitProgress = 0;
				komyaku.splitDirection = new THREE.Vector3(
					(Math.random() - 0.5) * 2,
					(Math.random() - 0.5) * 2,
					(Math.random() - 0.5) * 2
				).normalize();
				komyaku.childSphere1Offset = new THREE.Vector3();
				komyaku.childSphere2Offset = new THREE.Vector3();
			}

			// 分裂アニメーション進行
			if (komyaku.isSplitting) {
				komyaku.splitProgress += delta * 1.5;

				if (komyaku.splitProgress >= 1) {
					const splitKomyakus = createSplitKomyaku(komyaku);
					newKomyakus.push(...splitKomyakus);
					continue;
				}
			}

			// 基本的な物理演算
			const driftForce = komyaku.driftDirection
				.clone()
				.multiplyScalar(0.00005);
			komyaku.velocity.add(driftForce);

			const randomForce = new THREE.Vector3(
				(Math.random() - 0.5) * 0.00008,
				(Math.random() - 0.5) * 0.00008,
				(Math.random() - 0.5) * 0.00008
			);
			komyaku.velocity.add(randomForce);

			const time = state.clock.elapsedTime;
			const floatForce = new THREE.Vector3(
				Math.sin(time * 0.4 + komyaku.id) * 0.00002,
				Math.cos(time * 0.3 + komyaku.id) * 0.00002,
				Math.sin(time * 0.5 + komyaku.id) * 0.00001
			);
			komyaku.velocity.add(floatForce);

			komyaku.velocity.multiplyScalar(damping);

			const deltaTime = Math.min(delta, 1 / 30);
			komyaku.position.add(
				komyaku.velocity.clone().multiplyScalar(deltaTime * 60)
			);

			// 境界での跳ね返り
			if (komyaku.position.x + komyaku.radius > bounds.x) {
				komyaku.position.x = bounds.x - komyaku.radius;
				komyaku.velocity.x *= -bounceRestitution;
			} else if (komyaku.position.x - komyaku.radius < -bounds.x) {
				komyaku.position.x = -bounds.x + komyaku.radius;
				komyaku.velocity.x *= -bounceRestitution;
			}

			if (komyaku.position.y + komyaku.radius > bounds.y) {
				komyaku.position.y = bounds.y - komyaku.radius;
				komyaku.velocity.y *= -bounceRestitution;
			} else if (komyaku.position.y - komyaku.radius < -bounds.y) {
				komyaku.position.y = -bounds.y + komyaku.radius;
				komyaku.velocity.y *= -bounceRestitution;
			}

			if (komyaku.position.z + komyaku.radius > bounds.z) {
				komyaku.position.z = bounds.z - komyaku.radius;
				komyaku.velocity.z *= -bounceRestitution;
			} else if (komyaku.position.z - komyaku.radius < -bounds.z) {
				komyaku.position.z = -bounds.z + komyaku.radius;
				komyaku.velocity.z *= -bounceRestitution;
			}

			newKomyakus.push(komyaku);
		}

		// 弱い反発力を適用
		for (let i = 0; i < newKomyakus.length; i++) {
			for (let j = i + 1; j < newKomyakus.length; j++) {
				if (checkCollision(newKomyakus[i], newKomyakus[j])) {
					applyRepulsion(newKomyakus[i], newKomyakus[j]);
				}
			}
		}

		if (newKomyakus.length > MAX_KOMYAKU_COUNT) {
			newKomyakus.splice(MAX_KOMYAKU_COUNT);
		}

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
			style={{ width: "100%", height: "100%" }}
			dpr={Math.min(window.devicePixelRatio, 2)}
		>
			<PhysicsSystem />
			<ambientLight intensity={0.9} />

			{komyakus.map((komyaku) => (
				<Komyaku key={komyaku.id} komyakuData={komyaku} />
			))}
		</Canvas>
	);
}
