import {
  designById,
  diamondFor,
  eternityStoneCount,
  metalById,
  PURITY_LABEL,
  type Coverage,
  type MetalId,
  type ProfileId,
  type PurityId,
  type SettingId,
} from "./catalog";
import type { EngravingFontId } from "./fonts";
import type { Rounding, Tenant } from "./tenants";

/** The serialisable state of a customised piece — what goes to the cart / order. */
export interface JewelryConfig {
  designId: string;
  /** Birth month per stone (or per pattern slot for eternity bands). */
  stones: number[];
  metal: MetalId;
  purity: PurityId;
  ringSize: number;
  chainLength: number;
  profile: ProfileId;
  coverage: Coverage;
  engraving: string[];
  font: EngravingFontId;
}

/** Wholesale metal price per gram (USD). Demo values — supplied by the wholesaler. */
export const METAL_PRICE_PER_GRAM: Record<MetalId, Partial<Record<PurityId, number>>> = {
  yellow: { "10k": 41, "14k": 58, "18k": 76 },
  white: { "10k": 43, "14k": 61, "18k": 80 },
  rose: { "10k": 41, "14k": 58, "18k": 76 },
  platinum: { pt950: 64 },
};

const SETTING_FEE: Record<SettingId, number> = { prong: 16, bezel: 22, channel: 12 };
const ENGRAVING_FEE = 25;
const CHAIN_GRAMS_PER_INCH = 0.14;
const FX: Record<string, number> = { USD: 1, CAD: 1.37 };

export interface PriceLine {
  label: string;
  detail?: string;
  amount: number;
}

export interface Quote {
  lines: PriceLine[];
  wholesale: number;
  markupPct: number;
  retail: number;
  currency: string;
  stoneCount: number;
  totalCarat: number;
}

/** Physical stones on the piece, each with its birth month and carat weight. */
export function resolveStones(config: JewelryConfig) {
  const design = designById(config.designId);
  if (design.category === "ring" && design.layout === "eternity") {
    const n = eternityStoneCount(design, config.ringSize, config.coverage);
    return Array.from({ length: n }, (_, i) => ({
      month: config.stones[i % config.stones.length],
      carat: design.stone.carat,
    }));
  }
  return config.stones.map((month, i) => {
    const isCenter =
      design.category === "ring" &&
      design.layout === "center-row" &&
      design.centerStone &&
      i === Math.floor(config.stones.length / 2);
    return { month, carat: isCenter ? design.centerStone!.carat : design.stone.carat };
  });
}

function round(value: number, mode: Rounding) {
  switch (mode) {
    case "whole":
      return Math.round(value);
    case "ninety-nine":
      return Math.max(0, Math.ceil(value) - 0.01);
    case "five":
      return Math.ceil(value / 5) * 5;
    default:
      return Math.round(value * 100) / 100;
  }
}

export function quote(config: JewelryConfig, tenant: Pick<Tenant, "markupPct" | "rounding" | "currency">): Quote {
  const design = designById(config.designId);
  const metal = metalById(config.metal);
  const fx = FX[tenant.currency] ?? 1;
  const lines: PriceLine[] = [];

  // Metal weight scales with ring size / chain length.
  let grams = design.metalGrams;
  if (design.category === "ring") grams *= 1 + (config.ringSize - 7) * 0.045;
  else grams += config.chainLength * CHAIN_GRAMS_PER_INCH;
  const perGram = METAL_PRICE_PER_GRAM[config.metal][config.purity] ?? 0;
  lines.push({
    label: `${PURITY_LABEL[config.purity]} ${metal.name}`,
    detail: `${grams.toFixed(2)} g × ${perGram}/g`,
    amount: grams * perGram,
  });

  const stones = resolveStones(config);
  const byMonth = new Map<number, { count: number; carat: number }>();
  for (const s of stones) {
    const entry = byMonth.get(s.month) ?? { count: 0, carat: 0 };
    entry.count += 1;
    entry.carat += s.carat;
    byMonth.set(s.month, entry);
  }
  for (const [month, { count, carat }] of byMonth) {
    const d = diamondFor(month);
    lines.push({
      label: `${d.colorName} BirthDiamond × ${count}`,
      detail: `${carat.toFixed(2)} ct × ${d.pricePerCarat}/ct`,
      amount: carat * d.pricePerCarat,
    });
  }
  if (stones.length) {
    lines.push({
      label: `Diamond setting (${design.setting})`,
      detail: `${stones.length} × ${SETTING_FEE[design.setting]}`,
      amount: stones.length * SETTING_FEE[design.setting],
    });
  }

  const engraved = config.engraving.filter((t) => t.trim()).length;
  if (engraved) {
    lines.push({ label: "Engraving", detail: `${engraved} × ${ENGRAVING_FEE}`, amount: engraved * ENGRAVING_FEE });
  }
  lines.push({ label: "Craftsmanship & finishing", amount: design.labor });

  const wholesale = lines.reduce((sum, l) => sum + l.amount, 0) * fx;
  for (const l of lines) l.amount = Math.round(l.amount * fx * 100) / 100;

  return {
    lines,
    wholesale: Math.round(wholesale * 100) / 100,
    markupPct: tenant.markupPct,
    retail: round(wholesale * (1 + tenant.markupPct / 100), tenant.rounding),
    currency: tenant.currency,
    stoneCount: stones.length,
    totalCarat: stones.reduce((s, x) => s + x.carat, 0),
  };
}
