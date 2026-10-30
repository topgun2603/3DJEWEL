"use client";

import { CameraControls, ContactShadows, Environment, Float, Lightformer, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { designById } from "@/lib/catalog";
import { selectConfig, useConfigurator, type CameraView } from "@/lib/store";
import { EnvProvider } from "./materials";
import { Pendant } from "./Pendant";
import { Ring } from "./Ring";

type Preset = [number, number, number, number, number, number];

const PRESETS: Record<"ring" | "pendant", Record<CameraView, Preset>> = {
  ring: {
    hero: [2.1, 2, 3.3, 0, 0.3, 0],
    front: [0, 0.35, 4.6, 0, 0.15, 0],
    top: [0, 4.2, 1.1, 0, 0.7, 0],
    side: [4.4, 0.6, 0.01, 0, 0.2, 0],
    inside: [0, 1.75, 2.75, 0, -0.7, 0],
  },
  pendant: {
    hero: [2.4, 1.2, 5.6, 0, 0.1, 0],
    front: [0, 0.3, 6.2, 0, 0.1, 0],
    top: [0.6, 1.1, 2.2, 0, 0.55, 0],
    side: [6.2, 0.3, 0.01, 0, 0.1, 0],
    inside: [0, 0.3, -6.2, 0, 0.1, 0],
  },
};

function Rig({ category }: { category: "ring" | "pendant" }) {
  const ref = useRef<CameraControls>(null);
  const view = useConfigurator((s) => s.view);
  const autoRotate = useConfigurator((s) => s.autoRotate);
  const set = useConfigurator((s) => s.set);
  const aspect = useThree((s) => s.size.width / s.size.height);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const [px, py, pz, tx, ty, tz] = PRESETS[category][view.name];
    // Pull back on portrait screens so the piece always fits.
    const k = aspect < 1.2 ? Math.pow(1.2 / aspect, 0.9) : 1;
    c.setLookAt(px * k, py * k, pz * k, tx, ty, tz, true);
  }, [view, category, aspect]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const stop = () => set({ autoRotate: false });
    c.addEventListener("controlstart", stop);
    return () => c.removeEventListener("controlstart", stop);
  }, [set]);

  useFrame((_, dt) => {
    if (autoRotate && ref.current) ref.current.rotate(dt * 0.28, 0, false);
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.4}
      maxDistance={9}
      smoothTime={0.6}
      draggingSmoothTime={0.12}
    />
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    easing.damp3(g.scale, [1, 1, 1], 0.35, dt);
    easing.damp(g.rotation, "y", 0, 0.55, dt);
  });
  return (
    <group ref={ref} scale={0.4} rotation={[0, -Math.PI * 0.75, 0]}>
      {children}
    </group>
  );
}

function Studio({ accent }: { accent: string }) {
  return (
    <Environment resolution={512} frames={1}>
      {/* A dim base keeps metal contrasty while giving diamonds something to refract everywhere. */}
      <color attach="background" args={["#25211d"]} />
      {/* Overhead softbox grid — the main source of diamond fire. */}
      {[-3, -1, 1, 3].map((x) => (
        <Lightformer key={x} form="rect" intensity={3} position={[x * 1.6, 7, -1]} rotation-x={Math.PI / 2} scale={[1.2, 8, 1]} />
      ))}
      <group rotation={[-Math.PI / 3, 0, 1]}>
        <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
      </group>
      <Lightformer form="rect" intensity={2.2} position={[0, 2, 9]} scale={[12, 1.2, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.4} position={[0, -6, 2]} scale={[10, 3, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" color={accent} intensity={1.2} scale={10} position={[-15, 4, -18]} target={[0, 0, 0]} />
      <Lightformer form="ring" color="#fff4e6" intensity={1} scale={8} position={[16, -2, 12]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.5} position={[-9, 3, 6]} scale={[4, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.5} position={[9, 3, 6]} scale={[4, 6, 1]} target={[0, 0, 0]} />
    </Environment>
  );
}

function Piece() {
  const config = useConfigurator(useShallow(selectConfig));
  const design = designById(config.designId);
  return (
    <Reveal key={design.id}>
      {design.category === "ring" ? <Ring design={design} config={config} /> : <Pendant design={design} config={config} />}
    </Reveal>
  );
}

export default function Stage({ stage, accent, surface }: { stage: string; accent: string; surface: "dark" | "light" }) {
  const designId = useConfigurator((s) => s.designId);
  const category = designById(designId).category;
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [2.5, 1.7, 3.7], fov: 32, near: 0.05, far: 100 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <color attach="background" args={[stage]} />
      <fog attach="fog" args={[stage, 9, 22]} />
      <Suspense fallback={null}>
        <Studio accent={accent} />
        <EnvProvider>
          <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.25} floatingRange={[-0.04, 0.04]}>
            <Piece />
          </Float>
        </EnvProvider>
        <ContactShadows
          position={[0, category === "ring" ? -1.25 : -1.45, 0]}
          opacity={surface === "dark" ? 0.7 : 0.35}
          scale={7}
          blur={2.8}
          far={3}
          color={surface === "dark" ? "#000000" : "#5a4636"}
        />
        <Sparkles count={36} scale={[5, 3.5, 5]} size={2.2} speed={0.25} opacity={surface === "dark" ? 0.55 : 0.35} color={accent} />
      </Suspense>
      <Rig category={category} />
    </Canvas>
  );
}
