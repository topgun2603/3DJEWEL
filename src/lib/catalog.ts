/**
 * Product catalog. In production this comes from the wholesaler's admin / API
 * (diamond colors, price lists, CAD-derived specs). Everything here is demo data.
 */

export type MetalId = "yellow" | "white" | "rose" | "platinum";
export type PurityId = "10k" | "14k" | "18k" | "pt950";
export type CutId = "round" | "baguette" | "emerald" | "heart" | "oval" | "princess";
export type SettingId = "prong" | "bezel" | "channel";
export type ProfileId = "comfort" | "flat" | "domed";
export type Coverage = "half" | "full";

export interface BirthDiamond {
  month: number; // 1-12
  monthName: string;
  colorName: string;
  hex: string;
  /** Wholesale price per carat, USD. */
  pricePerCarat: number;
}

export const BIRTH_DIAMONDS: BirthDiamond[] = [
  { month: 1, monthName: "January", colorName: "Garnet Red", hex: "#b3203a", pricePerCarat: 1650 },
  { month: 2, monthName: "February", colorName: "Royal Violet", hex: "#8a5cd6", pricePerCarat: 1580 },
  { month: 3, monthName: "March", colorName: "Ice Blue", hex: "#9fe0f5", pricePerCarat: 1420 },
  { month: 4, monthName: "April", colorName: "Classic White", hex: "#ffffff", pricePerCarat: 1900 },
  { month: 5, monthName: "May", colorName: "Emerald Green", hex: "#25b56c", pricePerCarat: 1480 },
  { month: 6, monthName: "June", colorName: "Champagne", hex: "#e8c896", pricePerCarat: 1150 },
  { month: 7, monthName: "July", colorName: "Ruby Pink", hex: "#e3346f", pricePerCarat: 1720 },
  { month: 8, monthName: "August", colorName: "Lime Green", hex: "#b3dd3c", pricePerCarat: 1380 },
  { month: 9, monthName: "September", colorName: "Sapphire Blue", hex: "#2f63e0", pricePerCarat: 1550 },
  { month: 10, monthName: "October", colorName: "Blush Pink", hex: "#f7a3c7", pricePerCarat: 1600 },
  { month: 11, monthName: "November", colorName: "Canary Yellow", hex: "#ffc928", pricePerCarat: 1350 },
  { month: 12, monthName: "December", colorName: "Sky Blue", hex: "#4cb8ee", pricePerCarat: 1450 },
];

export const diamondFor = (month: number) => BIRTH_DIAMONDS[(month - 1 + 12) % 12];

export interface Metal {
  id: MetalId;
  name: string;
  purities: PurityId[];
  /** Render color per purity — higher karat gold is warmer/more saturated. */
  color: Partial<Record<PurityId, string>>;
  swatch: string;
}

export const METALS: Metal[] = [
  {
    id: "yellow",
    name: "Yellow Gold",
    purities: ["10k", "14k", "18k"],
    color: { "10k": "#dcc07e", "14k": "#e6c177", "18k": "#efbf62" },
    swatch: "linear-gradient(135deg,#fbe7a8,#d9a94a 55%,#f5d58a)",
  },
  {
    id: "white",
    name: "White Gold",
    purities: ["10k", "14k", "18k"],
    color: { "10k": "#dedbd2", "14k": "#e3e2dd", "18k": "#e9e9e7" },
    swatch: "linear-gradient(135deg,#ffffff,#c9c9c9 55%,#f1f1f1)",
  },
  {
    id: "rose",
    name: "Rose Gold",
    purities: ["10k", "14k", "18k"],
    color: { "10k": "#e2aa8c", "14k": "#e6a68a", "18k": "#e99f86" },
    swatch: "linear-gradient(135deg,#ffd9c7,#d48a6c 55%,#f6c2a8)",
  },
  {
    id: "platinum",
    name: "Platinum",
    purities: ["pt950"],
    color: { pt950: "#d9dbdf" },
    swatch: "linear-gradient(135deg,#f4f6f8,#a9adb3 55%,#e2e5e9)",
  },
];

export const PURITY_LABEL: Record<PurityId, string> = {
  "10k": "10K",
  "14k": "14K",
  "18k": "18K",
  pt950: "PT950",
};

export const metalById = (id: MetalId) => METALS.find((m) => m.id === id)!;

export const PROFILES: { id: ProfileId; name: string; note: string }[] = [
  { id: "comfort", name: "Comfort Fit", note: "Softly rounded inside & out" },
  { id: "domed", name: "Domed", note: "Rounded top, flat inside" },
  { id: "flat", name: "Flat Edge", note: "Modern squared profile" },
];

/** US ring sizes in half steps. */
export const RING_SIZES = Array.from({ length: 21 }, (_, i) => 3 + i * 0.5);
export const ringDiameterMm = (size: number) => 11.63 + 0.8128 * size;

export const CHAIN_LENGTHS = [16, 18, 20, 22];

interface StoneSpec {
  cut: CutId;
  /** Width across the band (mm) and length along the finger (mm). */
  widthMm: number;
  lengthMm: number;
  carat: number;
}

interface DesignBase {
  id: string;
  name: string;
  tagline: string;
  /** Base labor / finishing, wholesale USD. */
  labor: number;
  /** Metal weight in grams at the reference size (ring size 7 / 18" chain). */
  metalGrams: number;
  stoneCounts: number[];
  defaultCount: number;
  setting: SettingId;
  stone: StoneSpec;
  engravingSides: string[];
  engravingMaxChars: number;
}

export interface RingDesign extends DesignBase {
  category: "ring";
  layout: "row" | "center-row" | "eternity";
  /** Larger centre stone for `center-row` layouts. */
  centerStone?: StoneSpec;
  bandWidthMm: number;
  bandThicknessMm: number;
  gapMm: number;
}

export interface PendantDesign extends DesignBase {
  category: "pendant";
  layout: "bar";
}

export type Design = RingDesign | PendantDesign;

export const DESIGNS: Design[] = [
  {
    id: "aria",
    category: "ring",
    name: "Aria Family Ring",
    tagline: "A row of round BirthDiamonds, one for every name",
    layout: "row",
    labor: 140,
    metalGrams: 2.6,
    stoneCounts: [1, 2, 3, 4, 5, 6, 7],
    defaultCount: 3,
    setting: "prong",
    stone: { cut: "round", widthMm: 2.8, lengthMm: 2.8, carat: 0.08 },
    bandWidthMm: 1.9,
    bandThicknessMm: 1.5,
    gapMm: 0.35,
    engravingSides: ["Inside band"],
    engravingMaxChars: 22,
  },
  {
    id: "lumen",
    category: "ring",
    name: "Lumen Baguette Row",
    tagline: "Channel-set baguettes in a seamless line of color",
    layout: "row",
    labor: 165,
    metalGrams: 3.1,
    stoneCounts: [1, 2, 3, 4, 5, 6, 7],
    defaultCount: 5,
    setting: "channel",
    stone: { cut: "baguette", widthMm: 1.5, lengthMm: 2.6, carat: 0.06 },
    bandWidthMm: 3.1,
    bandThicknessMm: 1.6,
    gapMm: 0.12,
    engravingSides: ["Inside band"],
    engravingMaxChars: 22,
  },
  {
    id: "trinity",
    category: "ring",
    name: "Trinity Emerald",
    tagline: "An emerald-cut centre framed by round birth months",
    layout: "center-row",
    labor: 190,
    metalGrams: 2.9,
    stoneCounts: [1, 3, 5],
    defaultCount: 3,
    setting: "prong",
    stone: { cut: "round", widthMm: 2.9, lengthMm: 2.9, carat: 0.09 },
    centerStone: { cut: "emerald", widthMm: 4.2, lengthMm: 5.6, carat: 0.5 },
    bandWidthMm: 2,
    bandThicknessMm: 1.6,
    gapMm: 0.4,
    engravingSides: ["Inside band"],
    engravingMaxChars: 20,
  },
  {
    id: "hearts",
    category: "ring",
    name: "Kindred Hearts",
    tagline: "Bezel-set heart diamonds — a modern mother's ring",
    layout: "row",
    labor: 175,
    metalGrams: 3.2,
    stoneCounts: [1, 2, 3, 4, 5, 6],
    defaultCount: 2,
    setting: "bezel",
    stone: { cut: "heart", widthMm: 3.6, lengthMm: 3.4, carat: 0.14 },
    bandWidthMm: 2,
    bandThicknessMm: 1.6,
    gapMm: 0.3,
    engravingSides: ["Inside band"],
    engravingMaxChars: 20,
  },
  {
    id: "celestine",
    category: "ring",
    name: "Celestine Eternity",
    tagline: "Build your band — repeat up to 7 birth months",
    layout: "eternity",
    labor: 220,
    metalGrams: 3.4,
    stoneCounts: [1, 2, 3, 4, 5, 6, 7],
    defaultCount: 3,
    setting: "channel",
    stone: { cut: "round", widthMm: 2, lengthMm: 2, carat: 0.03 },
    bandWidthMm: 2.4,
    bandThicknessMm: 1.7,
    gapMm: 0.18,
    engravingSides: ["Inside band"],
    engravingMaxChars: 22,
  },
  {
    id: "legacy-bar",
    category: "pendant",
    name: "Legacy Bar Pendant",
    tagline: "A four-sided engraved bar with BirthDiamond charms",
    layout: "bar",
    labor: 120,
    metalGrams: 4.2,
    stoneCounts: [0, 1, 2, 3, 4],
    defaultCount: 2,
    setting: "bezel",
    stone: { cut: "round", widthMm: 3, lengthMm: 3, carat: 0.1 },
    engravingSides: ["Front", "Right", "Back", "Left"],
    engravingMaxChars: 12,
  },
];

export const designById = (id: string) => DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];

/** Number of physical stones on an eternity band for a given coverage and size. */
export function eternityStoneCount(design: RingDesign, size: number, coverage: Coverage) {
  const outerRadiusMm = ringDiameterMm(size) / 2 + design.bandThicknessMm;
  const pitch = design.stone.widthMm + design.gapMm;
  const arc = coverage === "full" ? Math.PI * 2 * outerRadiusMm : Math.PI * outerRadiusMm * 0.95;
  return Math.floor(arc / pitch);
}
