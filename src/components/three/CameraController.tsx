"use client";

import { useFrame, useThree } from "@react-three/fiber";

export default function CameraController() {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.lerp({ x: 0, y: 0, z: 4 } as any, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}