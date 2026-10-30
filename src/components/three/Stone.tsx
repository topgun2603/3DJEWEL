"use client";

import { MeshRefractionMaterial } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { diamondFor, type CutId, type SettingId } from "@/lib/catalog";
import { bezelGeometry, gemGeometry, gemProportions, prongPoints } from "./geometry";
import { useEnvMap } from "./materials";

interface StoneProps {
  cut: CutId;
  w: number;
  l: number;
  month: number;
  setting: SettingId;
  metal: THREE.Material;
  /** How far the culet sinks into the metal below the girdle (local -Y). */
  seatDepth: number;
  /** Prong bases are pulled within this half-width so they land on the band. */
  baseHalfWidth?: number;
  onSelect?: () => void;
}

// three r187 dropped this chunk; drei's refraction shader still #includes it but only
// needs it for PMREM env maps. Our studio env is a plain cube map, so an empty chunk is safe.
const chunks = THREE.ShaderChunk as Record<string, string>;
chunks.cube_uv_reflection_fragment ??= "";

const up = new THREE.Vector3(0, 1, 0);

function Prong({ from, to, r, metal }: { from: THREE.Vector3; to: THREE.Vector3; r: number; metal: THREE.Material }) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from);
    return {
      length: dir.length(),
      position: new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()),
    };
  }, [from, to]);
  return (
    <group>
      <mesh position={position} quaternion={quaternion} material={metal}>
        <cylinderGeometry args={[r, r * 1.15, length, 10]} />
      </mesh>
      <mesh position={to} material={metal}>
        <sphereGeometry args={[r * 1.12, 12, 10]} />
      </mesh>
    </group>
  );
}

export function Stone({ cut, w, l, month, setting, metal, seatDepth, baseHalfWidth, onSelect }: StoneProps) {
  const env = useEnvMap();
  const geometry = useMemo(() => gemGeometry(cut, w, l), [cut, w, l]);
  const p = useMemo(() => gemProportions(cut, w, l), [cut, w, l]);
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const pop = useRef(0);
  const color = diamondFor(month).hex;

  // Pop the stone whenever its colour changes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    pop.current = 0.45;
  }, [month]);

  useFrame((_, dt) => {
    if (!group.current) return;
    pop.current = Math.max(0, pop.current - dt);
    const target = 1 + (hovered ? 0.06 : 0) + Math.sin((pop.current / 0.45) * Math.PI) * 0.28;
    easing.damp3(group.current.scale, [target, target, target], 0.08, dt);
  });

  const prongs = useMemo(() => {
    if (setting !== "prong") return [];
    const r = Math.max(0.012, Math.min(w, l) * 0.055);
    return prongPoints(cut, w, l).map(([x, z]) => {
      const lim = baseHalfWidth ?? Infinity;
      return {
        r,
        to: new THREE.Vector3(x * 1.02, p.crown * 0.55, z * 1.02),
        from: new THREE.Vector3(x * 0.55, -seatDepth - 0.03, THREE.MathUtils.clamp(z * 0.5, -lim, lim)),
      };
    });
  }, [setting, cut, w, l, p.crown, seatDepth, baseHalfWidth]);

  const bezel = useMemo(() => {
    if (setting !== "bezel") return null;
    const wall = Math.max(0.018, Math.min(w, l) * 0.07);
    const height = p.crown * 0.3 + seatDepth + 0.02;
    const geo = bezelGeometry(cut, w, l, wall, height);
    geo.translate(0, p.crown * 0.3, 0);
    return geo;
  }, [setting, cut, w, l, p.crown, seatDepth]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return; // it was a drag, not a tap
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <group>
      <group ref={group}>
        <mesh
          geometry={geometry}
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "";
          }}
        >
          {env ? (
            <MeshRefractionMaterial
              envMap={env}
              bounces={3}
              ior={2.42}
              // The shader blends each facet toward white by this amount; keep it low so the
              // birth-month colour stays visible.
              fresnel={0.2}
              aberrationStrength={0.012}
              color={color}
              fastChroma
              toneMapped={false}
            />
          ) : (
            <meshPhysicalMaterial color={color} roughness={0} transmission={1} ior={2.42} thickness={0.3} />
          )}
        </mesh>
      </group>
      {prongs.map((pr, i) => (
        <Prong key={i} from={pr.from} to={pr.to} r={pr.r} metal={metal} />
      ))}
      {bezel && <mesh geometry={bezel} material={metal} />}
    </group>
  );
}
