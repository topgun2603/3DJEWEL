"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useMemo, useState } from "react";
import * as THREE from "three";
import { metalById, type MetalId, type PurityId } from "@/lib/catalog";

/** One shared metal material; its colour eases toward the selection so metal swaps animate. */
export function useMetalMaterial(metal: MetalId, purity: PurityId) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        metalness: 1,
        roughness: 0.14,
        envMapIntensity: 1.35,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const target = useMemo(() => new THREE.Color(), []);
  const m = metalById(metal);
  target.set(m.color[purity] ?? Object.values(m.color)[0]!);
  const first = useMemo(() => ({ done: false }), []);
  if (!first.done) {
    material.color.copy(target);
    first.done = true;
  }
  useFrame((_, dt) => {
    material.color.lerp(target, 1 - Math.exp(-dt * 6));
  });
  return material;
}

export function useEngraveMaterial(metal: THREE.MeshStandardMaterial, alphaMap: THREE.Texture | null) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        metalness: 0.85,
        roughness: 0.55,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [],
  );
  material.alphaMap = alphaMap;
  material.needsUpdate = true;
  useFrame(() => {
    material.color.copy(metal.color).multiplyScalar(0.38);
  });
  return material;
}

/** The studio cube map that the <Environment> renders, used by the ray-traced diamond shader. */
const EnvContext = createContext<THREE.Texture | null>(null);
export const useEnvMap = () => useContext(EnvContext);

export function EnvProvider({ children }: { children: React.ReactNode }) {
  const scene = useThree((s) => s.scene);
  const [env, setEnv] = useState<THREE.Texture | null>(null);
  useFrame(() => {
    if (scene.environment && scene.environment !== env) setEnv(scene.environment);
  });
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}
