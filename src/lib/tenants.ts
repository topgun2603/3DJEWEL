/**
 * Retailers (tenants). Each one embeds the same configurator with its own
 * branding, assortment and markup. In production these live in a database and
 * are edited from the retailer console.
 */

export type Rounding = "none" | "whole" | "ninety-nine" | "five";

export interface Tenant {
  id: string;
  name: string;
  tagline: string;
  /** Retail markup over wholesale, in percent. */
  markupPct: number;
  rounding: Rounding;
  currency: string;
  locale: string;
  designs: string[];
  theme: {
    surface: "dark" | "light";
    accent: string;
    accentForeground: string;
    /** 3D stage background. */
    stage: string;
  };
}

export const TENANTS: Tenant[] = [
  {
    id: "aurelia",
    name: "Maison Aurelia",
    tagline: "Fine jewelry since 1962",
    markupPct: 120,
    rounding: "ninety-nine",
    currency: "USD",
    locale: "en-US",
    designs: ["aria", "lumen", "trinity", "hearts", "celestine", "legacy-bar"],
    theme: { surface: "dark", accent: "#d8b26e", accentForeground: "#1a1408", stage: "#121010" },
  },
  {
    id: "bloom",
    name: "Bloom & Co.",
    tagline: "Modern heirlooms",
    markupPct: 95,
    rounding: "whole",
    currency: "USD",
    locale: "en-US",
    designs: ["aria", "hearts", "celestine", "legacy-bar"],
    theme: { surface: "light", accent: "#b85c72", accentForeground: "#ffffff", stage: "#f3ebe7" },
  },
  {
    id: "northstar",
    name: "Northstar Jewelers",
    tagline: "Family owned in Toronto",
    markupPct: 140,
    rounding: "five",
    currency: "CAD",
    locale: "en-CA",
    designs: ["lumen", "trinity", "celestine", "aria"],
    theme: { surface: "light", accent: "#1f3a68", accentForeground: "#ffffff", stage: "#e9edf3" },
  },
];

export const tenantById = (id: string) => TENANTS.find((t) => t.id === id);
