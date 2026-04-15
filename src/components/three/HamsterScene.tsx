"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Lights from "./Lights";

type Props = {
  lookTarget: { x: number; y: number } | null;
  jumpTrigger: number;
};

function HamsterModel({
  lookTarget,
  jumpTrigger,
}: {
  lookTarget: { x: number; y: number } | null;
  jumpTrigger: number;
}) {
  const wrapperRef = useRef<THREE.Group>(null);
  const hamsterMountRef = useRef<THREE.Group>(null);
  const hamsterSceneRef = useRef<THREE.Object3D | null>(null);

  const { scene } = useGLTF("/models/hamster.glb");

  const jumpRef = useRef({
    active: false,
    start: 0,
  });

  const gazeRef = useRef({
    rotY: 0,
    rotX: 0,
  });

  useEffect(() => {
    if (jumpTrigger <= 0) return;
    jumpRef.current.active = true;
    jumpRef.current.start = performance.now();
  }, [jumpTrigger]);

  useEffect(() => {
    if (!hamsterMountRef.current) return;

    const clonedScene = scene.clone(true);
    hamsterMountRef.current.clear();
    hamsterMountRef.current.add(clonedScene);

    hamsterSceneRef.current = clonedScene;

    // ✅ 여기서 glb 자체의 기본 방향을 맞춘다
    // 하나씩 바꿔보면 됨: 0 / Math.PI / Math.PI/2 / -Math.PI/2
    clonedScene.rotation.set(0, -Math.PI / 2, 0);

    // 혹시 모델 크기/위치도 glb 내부 축 기준으로 다르면 여기서 같이 조정
    clonedScene.position.set(0, 0, 0);
    clonedScene.scale.set(1, 1, 1);
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const wrapper = wrapperRef.current;
    const hamsterSceneObj = hamsterSceneRef.current;

    if (!wrapper || !hamsterSceneObj) return;

    const floatY = Math.sin(t * 1.6) * 0.05;
    const breathe = 1 + Math.sin(t * 2.0) * 0.012;

    let targetRotY = 0;
    let targetRotX = 0;

    if (lookTarget) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const dx = lookTarget.x - centerX;
      const dy = lookTarget.y - centerY;

      targetRotY = THREE.MathUtils.clamp(dx * 0.001, -0.26, 0.26);
      targetRotX = THREE.MathUtils.clamp(-dy * 0.00055, -0.12, 0.12);
    }

    gazeRef.current.rotY = THREE.MathUtils.lerp(
      gazeRef.current.rotY,
      targetRotY,
      0.085
    );

    gazeRef.current.rotX = THREE.MathUtils.lerp(
      gazeRef.current.rotX,
      targetRotX,
      0.085
    );

    // ✅ 바깥 wrapper는 둥실/점프/전체 이동만 담당
    let jumpY = 0;
    let squash = 1;

    if (jumpRef.current.active) {
      const elapsed = (performance.now() - jumpRef.current.start) / 1000;
      const duration = 0.82;

      if (elapsed < duration) {
        const p = elapsed / duration;

        jumpY = Math.sin(p * Math.PI) * 0.4;

        squash =
          p < 0.18
            ? THREE.MathUtils.lerp(0.95, 1.04, p / 0.18)
            : p > 0.78
            ? THREE.MathUtils.lerp(1.03, 0.97, (p - 0.78) / 0.22)
            : 1.02;
      } else {
        jumpRef.current.active = false;
      }
    }

    wrapper.position.y = floatY + jumpY;
    wrapper.scale.set(breathe * squash, breathe / squash, breathe * squash);

    // ✅ 실제 glb 오브젝트를 직접 회전
    hamsterSceneObj.rotation.y = -Math.PI / 2 + gazeRef.current.rotY;
    hamsterSceneObj.rotation.x = gazeRef.current.rotX;
  });

  return (
    <group ref={wrapperRef}>
      <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 64]} />
        <meshBasicMaterial color="#A8F0C6" transparent opacity={0.18} />
      </mesh>

      <group
        ref={hamsterMountRef}
        position={[0, -1.05, 0]}
        scale={[1.5, 1.5, 1.5]}
      />
    </group>
  );
}

export default function HamsterScene({ lookTarget, jumpTrigger }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.2], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Lights />
      <HamsterModel lookTarget={lookTarget} jumpTrigger={jumpTrigger} />
    </Canvas>
  );
}

useGLTF.preload("/models/hamster.glb");