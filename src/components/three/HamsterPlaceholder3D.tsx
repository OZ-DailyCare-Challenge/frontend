"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function HamsterPlaceholder3D() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y = Math.sin(t * 1.2) * 0.15 + state.mouse.x * 0.25;
    group.rotation.x = state.mouse.y * 0.12;
    const scale = 1 + Math.sin(t * 2) * 0.02;
    group.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.05, 48, 48]} />
        <meshStandardMaterial color="#B9F3CE" />
      </mesh>

      <mesh position={[-0.58, 0.82, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial color="#DFF8E8" />
      </mesh>

      <mesh position={[0.58, 0.82, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial color="#DFF8E8" />
      </mesh>

      <mesh position={[-0.24, 0.12, 0.92]}>
        <sphereGeometry args={[0.06, 24, 24]} />
        <meshStandardMaterial color="#1b2b22" />
      </mesh>

      <mesh position={[0.24, 0.12, 0.92]}>
        <sphereGeometry args={[0.06, 24, 24]} />
        <meshStandardMaterial color="#1b2b22" />
      </mesh>

      <mesh position={[0, -0.04, 0.95]}>
        <sphereGeometry args={[0.05, 24, 24]} />
        <meshStandardMaterial color="#345746" />
      </mesh>

      <mesh position={[0, -0.28, 0.72]} scale={[0.8, 0.55, 0.25]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial color="#F8FFF8" />
      </mesh>
    </group>
  );
}