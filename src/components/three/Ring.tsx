"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { eternityStoneCount, ringDiameterMm, type CutId, type RingDesign } from "@/lib/catalog";
import type { JewelryConfig } from "@/lib/pricing";
import { useConfigurator } from "@/lib/store";
import { bandGeometry, gemProportions } from "./geometry";
import { useEngravingTexture } from "./engraving";
import { useEngraveMaterial, useMetalMaterial } from "./materials";
import { Stone } from "./Stone";

/** Scene units are centimetres: catalog millimetres / 10. */
const MM = 0.1;

interface Placement {
  cut: CutId;
  w: number;
  l: number;
  theta: number;
  slot: number;
  month: number;
}

function layoutStones(design: RingDesign, config: JewelryConfig, outerR: number): Placement[] {
  const s = design.stone;
  const gap = design.gapMm * MM;

  if (design.layout === "eternity") {
    const n = eternityStoneCount(design, config.ringSize, config.coverage);
    const full = config.coverage === "full";
    const step = full ? (Math.PI * 2) / n : (s.widthMm * MM + gap) / (outerR + 0.03);
    return Array.from({ length: n }, (_, i) => ({
      cut: s.cut,
      w: s.widthMm * MM,
      l: s.lengthMm * MM,
      theta: full ? i * step : (i - (n - 1) / 2) * step,
      slot: i % config.stones.length,
      month: config.stones[i % config.stones.length],
    }));
  }

  const count = config.stones.length;
  const center = Math.floor(count / 2);
  const specs = config.stones.map((_, i) =>
    design.layout === "center-row" && design.centerStone && i === center && count % 2 === 1 ? design.centerStone : s,
  );
  const rRef = outerR + 0.03;
  const total = specs.reduce((sum, sp) => sum + sp.widthMm * MM, 0) + gap * (count - 1);
  let cursor = -total / 2;
  return specs.map((sp, i) => {
    const w = sp.widthMm * MM;
    const theta = (cursor + w / 2) / rRef;
    cursor += w + gap;
    return { cut: sp.cut, w, l: sp.lengthMm * MM, theta, slot: i, month: config.stones[i] };
  });
}

function InsideEngraving({ text, config, innerR, width, metal }: {
  text: string;
  config: JewelryConfig;
  innerR: number;
  width: number;
  metal: THREE.MeshStandardMaterial;
}) {
  const height = width * 0.62;
  const circumference = Math.PI * 2 * innerR;
  const texW = 4096;
  const texH = 160;
  // flipY off: viewed from inside the band, canvas-top must map to the far edge.
  const alpha = useEngravingTexture(text, config.font, { width: texW, height: texH, size: 0.68, flipY: false });
  const material = useEngraveMaterial(metal, alpha);
  material.side = THREE.BackSide;

  const geometry = useMemo(() => {
    // thetaStart = π puts u = 0.5 at the bottom of the band, where the inscription is centred.
    const g = new THREE.CylinderGeometry(innerR - 0.0015, innerR - 0.0015, height, 192, 1, true, Math.PI, Math.PI * 2);
    g.rotateX(Math.PI / 2);
    // Stretch U so the canvas keeps its aspect on the strip (letters stay unsquashed).
    const ratio = circumference / height / (texW / texH);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) - 0.5) * ratio + 0.5);
    return g;
  }, [innerR, height, circumference]);

  if (!text.trim()) return null;
  return <mesh geometry={geometry} material={material} />;
}

export function Ring({ design, config }: { design: RingDesign; config: JewelryConfig }) {
  const setActiveStone = useConfigurator((s) => s.setActiveStone);
  const metal = useMetalMaterial(config.metal, config.purity);

  const innerR = (ringDiameterMm(config.ringSize) / 2) * MM;
  const thickness = design.bandThicknessMm * MM;
  const width = design.bandWidthMm * MM;
  const outerR = innerR + thickness;

  const band = useMemo(() => bandGeometry(innerR, thickness, width, config.profile), [innerR, thickness, width, config.profile]);
  const stones = useMemo(() => layoutStones(design, config, outerR), [design, config, outerR]);

  const channel = useMemo(() => {
    if (design.setting !== "channel" || !stones.length) return null;
    const full = design.layout === "eternity" && config.coverage === "full";
    const first = stones[0];
    const last = stones[stones.length - 1];
    const p = gemProportions(first.cut, first.w, first.l);
    const seatR = outerR + p.pavilion * 0.35;
    const pad = (first.w * 0.6) / seatR;
    const arc = full ? Math.PI * 2 : last.theta - first.theta + pad * 2;
    const tube = 0.028;
    // Stones sit at polar angle π/2 − θ; torus arcs start at +X and run counter-clockwise.
    const rotation = Math.PI / 2 - last.theta - pad;
    return { radius: seatR - 0.004, tube, arc, rotation, z: first.l / 2 + tube * 0.7 };
  }, [design, stones, outerR, config.coverage]);

  return (
    <group>
      <mesh geometry={band} material={metal} />

      {stones.map((st, i) => {
        const p = gemProportions(st.cut, st.w, st.l);
        const seatDepth = design.setting === "channel" ? p.pavilion * 0.35 : p.pavilion * 0.55;
        const r = outerR + seatDepth;
        return (
          <group key={`${i}-${st.cut}`} position={[r * Math.sin(st.theta), r * Math.cos(st.theta), 0]} rotation={[0, 0, -st.theta]}>
            <Stone
              cut={st.cut}
              w={st.w}
              l={st.l}
              month={st.month}
              setting={design.setting}
              metal={metal}
              seatDepth={seatDepth}
              baseHalfWidth={width * 0.4}
              onSelect={() => setActiveStone(st.slot)}
            />
          </group>
        );
      })}

      {channel &&
        [-1, 1].map((side) => (
          <mesh key={side} position={[0, 0, side * channel.z]} rotation={[0, 0, channel.rotation]} material={metal}>
            <torusGeometry args={[channel.radius, channel.tube, 16, 220, channel.arc]} />
          </mesh>
        ))}

      <InsideEngraving text={config.engraving[0] ?? ""} config={config} innerR={innerR} width={width} metal={metal} />
    </group>
  );
}
