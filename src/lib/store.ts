"use client";

import { create } from "zustand";
import { designById, metalById, type MetalId } from "./catalog";
import type { JewelryConfig } from "./pricing";

export type CameraView = "hero" | "front" | "top" | "side" | "inside";

interface ConfiguratorState extends JewelryConfig {
  activeStone: number;
  activeSide: number;
  view: { name: CameraView; nonce: number };
  autoRotate: boolean;
  /** Bumped whenever something changes so the 3D stage can play a reveal. */
  pulse: number;

  setDesign: (id: string) => void;
  setStoneCount: (n: number) => void;
  setStoneMonth: (index: number, month: number) => void;
  setAllStones: (month: number) => void;
  setActiveStone: (i: number) => void;
  setMetal: (metal: MetalId) => void;
  set: (patch: Partial<JewelryConfig & { activeSide: number; autoRotate: boolean }>) => void;
  setEngraving: (side: number, text: string) => void;
  goTo: (view: CameraView) => void;
  load: (config: Partial<JewelryConfig>) => void;
}

const DEFAULT_MONTHS = [2, 4, 9, 11, 5, 7, 12];

export const initialConfig = (designId = "aria"): JewelryConfig => {
  const design = designById(designId);
  return {
    designId: design.id,
    stones: DEFAULT_MONTHS.slice(0, design.defaultCount),
    metal: "yellow",
    purity: "14k",
    ringSize: 7,
    chainLength: 18,
    profile: "comfort",
    coverage: "half",
    engraving: design.engravingSides.map(() => ""),
    font: "classic",
  };
};

export const useConfigurator = create<ConfiguratorState>((set, get) => ({
  ...initialConfig(),
  activeStone: 0,
  activeSide: 0,
  view: { name: "hero", nonce: 0 },
  autoRotate: true,
  pulse: 0,

  setDesign: (id) => {
    const design = designById(id);
    const { stones, engraving } = get();
    const count = design.stoneCounts.includes(stones.length) ? stones.length : design.defaultCount;
    const next = Array.from({ length: count }, (_, i) => stones[i] ?? DEFAULT_MONTHS[i % 7]);
    set({
      designId: design.id,
      stones: next,
      engraving: design.engravingSides.map((_, i) => engraving[i] ?? ""),
      activeStone: 0,
      activeSide: 0,
      autoRotate: true,
      view: { name: "hero", nonce: get().view.nonce + 1 },
    });
  },
  setStoneCount: (n) => {
    const { stones, activeStone } = get();
    const used = new Set(stones);
    const fresh = DEFAULT_MONTHS.filter((m) => !used.has(m));
    const next = Array.from({ length: n }, (_, i) => stones[i] ?? fresh.shift() ?? DEFAULT_MONTHS[i % 7]);
    set({ stones: next, activeStone: Math.min(activeStone, Math.max(0, n - 1)), pulse: get().pulse + 1 });
  },
  setStoneMonth: (index, month) => {
    const stones = [...get().stones];
    stones[index] = month;
    set({ stones, pulse: get().pulse + 1 });
  },
  setAllStones: (month) => set({ stones: get().stones.map(() => month), pulse: get().pulse + 1 }),
  setActiveStone: (i) => set({ activeStone: i }),
  setMetal: (metal) => {
    const m = metalById(metal);
    const purity = m.purities.includes(get().purity) ? get().purity : m.purities[Math.min(1, m.purities.length - 1)];
    set({ metal, purity });
  },
  set: (patch) => set(patch),
  setEngraving: (side, text) => {
    const engraving = [...get().engraving];
    engraving[side] = text;
    set({ engraving });
  },
  goTo: (name) => set({ view: { name, nonce: get().view.nonce + 1 }, autoRotate: name === "hero" }),
  load: (config) => {
    const base = initialConfig(config.designId);
    set({ ...base, ...config, activeStone: 0 });
  },
}));

export const selectConfig = (s: ConfiguratorState): JewelryConfig => ({
  designId: s.designId,
  stones: s.stones,
  metal: s.metal,
  purity: s.purity,
  ringSize: s.ringSize,
  chainLength: s.chainLength,
  profile: s.profile,
  coverage: s.coverage,
  engraving: s.engraving,
  font: s.font,
});

export function encodeConfig(config: JewelryConfig) {
  const json = JSON.stringify(config);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeConfig(token: string): Partial<JewelryConfig> | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}
