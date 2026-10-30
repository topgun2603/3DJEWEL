import { Cinzel, Cormorant_Garamond, Great_Vibes, Inter } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
export const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
export const cinzel = Cinzel({ subsets: ["latin"], weight: ["500"], variable: "--font-block", display: "swap" });

/** Engraving fonts. `family` is the resolved CSS family so it can also be used on a 2D canvas. */
export const ENGRAVING_FONTS = {
  classic: { label: "Classic Serif", family: cormorant.style.fontFamily, weight: "600", scale: 1 },
  script: { label: "Script", family: greatVibes.style.fontFamily, weight: "400", scale: 1.15 },
  modern: { label: "Modern Sans", family: inter.style.fontFamily, weight: "500", scale: 0.85 },
  block: { label: "Roman Block", family: cinzel.style.fontFamily, weight: "500", scale: 0.85 },
} as const;

export type EngravingFontId = keyof typeof ENGRAVING_FONTS;
