"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { PendantDesign } from "@/lib/catalog";
import type { JewelryConfig } from "@/lib/pricing";
import { useConfigurator } from "@/lib/store";
import { useEngravingTexture } from "./engraving";
import { useEngraveMaterial, useMetalMaterial } from "./materials";
import { Stone } from "./Stone";

const BAR = { w: 0.3, h: 2, d: 0.3 };
const TOP = BAR.h / 2;

function Chain({ metal, length }: { metal: THREE.Material; length: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spread = 1.1 + (length - 16) * 0.06;
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-spread * 1.25, 3.9, -0.7),
        new THREE.Vector3(-spread * 0.75, 2.6, -0.25),
        new THREE.Vector3(-0.14, TOP + 0.36, 0),
        new THREE.Vector3(0, TOP + 0.3, 0),
        new THREE.Vector3(0.14, TOP + 0.36, 0),
        new THREE.Vector3(spread * 0.75, 2.6, -0.25),
        new THREE.Vector3(spread * 1.25, 3.9, -0.7),
      ]),
    [spread],
  );
  const pitch = 0.046;
  const count = Math.floor(curve.getLength() / pitch);
  const geometry = useMemo(() => {
    const g = new THREE.TorusGeometry(0.02, 0.0065, 8, 18);
    g.rotateX(Math.PI / 2);
    g.scale(1, 1, 1.55);
    return g;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const p = curve.getPointAt(t);
      dummy.position.copy(p);
      dummy.lookAt(p.clone().add(curve.getTangentAt(t)));
      dummy.rotateZ(i % 2 ? Math.PI / 2 : 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [curve, count]);

  return <instancedMesh key={count} ref={ref} args={[geometry, metal, count]} />;
}

function Face({ text, font, metal, position, rotation }: {
  text: string;
  font: JewelryConfig["font"];
  metal: THREE.MeshStandardMaterial;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const alpha = useEngravingTexture(text, font, { width: 160, height: 1280, vertical: true, size: 0.7 });
  const material = useEngraveMaterial(metal, alpha);
  if (!text.trim()) return null;
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <planeGeometry args={[BAR.w * 0.8, BAR.h * 0.86]} />
    </mesh>
  );
}

function Charm({ index, total, month, metal, onSelect }: {
  index: number;
  total: number;
  month: number;
  metal: THREE.Material;
  onSelect: () => void;
}) {
  const swing = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!swing.current) return;
    const t = clock.elapsedTime;
    swing.current.rotation.z = Math.sin(t * 1.4 + index * 1.7) * 0.07;
    swing.current.rotation.x = Math.sin(t * 1.1 + index) * 0.05;
  });
  // Charms hang from the bail and fan out so each colour stays visible.
  const fan = (index - (total - 1) / 2) * 0.34;
  const w = 0.26;
  return (
    <group position={[0, TOP + 0.12, 0.05 + index * 0.02]} rotation={[0, 0, fan]}>
      <group ref={swing}>
        <mesh material={metal} position={[0, -0.09, 0]}>
          <torusGeometry args={[0.04, 0.009, 8, 24]} />
        </mesh>
        <group position={[0, -0.27, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <Stone cut="round" w={w} l={w} month={month} setting="bezel" metal={metal} seatDepth={0.05} onSelect={onSelect} />
        </group>
      </group>
    </group>
  );
}

export function Pendant({ config }: { design: PendantDesign; config: JewelryConfig }) {
  const setActiveStone = useConfigurator((s) => s.setActiveStone);
  const metal = useMetalMaterial(config.metal, config.purity);
  const off = BAR.w / 2 + 0.001;
  const faces: { position: [number, number, number]; rotation: [number, number, number] }[] = [
    { position: [0, 0, off], rotation: [0, 0, 0] },
    { position: [off, 0, 0], rotation: [0, Math.PI / 2, 0] },
    { position: [0, 0, -off], rotation: [0, Math.PI, 0] },
    { position: [-off, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  ];

  return (
    <group position={[0, -0.25, 0]}>
      <RoundedBox args={[BAR.w, BAR.h, BAR.d]} radius={0.035} smoothness={4} material={metal} />
      {/* Bail */}
      <mesh material={metal} position={[0, TOP + 0.12, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.1, 0.022, 14, 40]} />
      </mesh>
      {faces.map((f, i) => (
        <Face key={i} text={config.engraving[i] ?? ""} font={config.font} metal={metal} {...f} />
      ))}
      {config.stones.map((month, i) => (
        <Charm key={i} index={i} total={config.stones.length} month={month} metal={metal} onSelect={() => setActiveStone(i)} />
      ))}
      <Chain metal={metal} length={config.chainLength} />
    </group>
  );
}
