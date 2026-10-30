"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import {
  BIRTH_DIAMONDS,
  CHAIN_LENGTHS,
  designById,
  diamondFor,
  eternityStoneCount,
  METALS,
  PROFILES,
  PURITY_LABEL,
  RING_SIZES,
  ringDiameterMm,
  type Design,
} from "@/lib/catalog";
import { ENGRAVING_FONTS, type EngravingFontId } from "@/lib/fonts";
import { useConfigurator } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */

export function DesignGlyph({ design, months, className }: { design: Design; months: number[]; className?: string }) {
  const colors = months.length ? months.map((m) => diamondFor(m).hex) : ["#ffffff"];
  if (design.category === "pendant") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden>
        <path d="M14 4 Q32 26 50 4" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.2" />
        <rect x="28" y="20" width="8" height="38" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
        {colors.slice(0, 4).map((c, i, a) => (
          <circle key={i} cx={32 + (i - (a.length - 1) / 2) * 6} cy="25" r="3" fill={c} stroke="currentColor" strokeOpacity=".4" strokeWidth=".6" />
        ))}
      </svg>
    );
  }
  const n = design.layout === "eternity" ? 9 : Math.max(1, colors.length);
  const span = design.layout === "eternity" ? 150 : Math.min(110, n * 18);
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="36" r="20" fill="none" stroke="currentColor" strokeWidth="3.2" />
      {Array.from({ length: n }, (_, i) => {
        const a = ((-span / 2 + (n === 1 ? span / 2 : (i * span) / (n - 1))) * Math.PI) / 180;
        const x = 32 + Math.sin(a) * 20;
        const y = 36 - Math.cos(a) * 20;
        const c = colors[i % colors.length];
        const big = design.layout === "center-row" && i === Math.floor(n / 2) && n % 2 === 1;
        const s = design.layout === "eternity" ? 2.6 : big ? 5.5 : 3.6;
        const rot = (a * 180) / Math.PI;
        if (design.stone.cut === "baguette" || big)
          return <rect key={i} x={x - s * 0.6} y={y - s} width={s * 1.2} height={s * 2} transform={`rotate(${rot} ${x} ${y})`} fill={c} stroke="currentColor" strokeOpacity=".4" strokeWidth=".6" />;
        if (design.stone.cut === "heart")
          return <path key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s / 4})`} d="M0 3.5 C-5 0 -4 -4.5 -1.6 -4.5 C-.6 -4.5 0 -3.6 0 -3 C0 -3.6 .6 -4.5 1.6 -4.5 C4 -4.5 5 0 0 3.5Z" fill={c} stroke="currentColor" strokeOpacity=".4" strokeWidth=".5" />;
        return <circle key={i} cx={x} cy={y} r={s} fill={c} stroke="currentColor" strokeOpacity=".4" strokeWidth=".6" />;
      })}
    </svg>
  );
}

export function DesignStep({ designs }: { designs: Design[] }) {
  const designId = useConfigurator((s) => s.designId);
  const stones = useConfigurator((s) => s.stones);
  const setDesign = useConfigurator((s) => s.setDesign);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {designs.map((d) => {
        const active = d.id === designId;
        return (
          <motion.button
            key={d.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDesign(d.id)}
            className={cn(
              "group relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
              active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/25 hover:bg-muted/50",
            )}
          >
            <DesignGlyph design={d} months={stones} className={cn("size-12", active ? "text-primary" : "text-muted-foreground")} />
            <div>
              <div className="text-sm font-medium leading-tight">{d.name}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{d.tagline}</div>
            </div>
            {active && (
              <motion.span layoutId="design-check" className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function DiamondStep() {
  const s = useConfigurator();
  const design = designById(s.designId);
  const counts = design.stoneCounts;
  const idx = counts.indexOf(s.stones.length);
  const isEternity = design.category === "ring" && design.layout === "eternity";
  const isPendant = design.category === "pendant";
  const active = Math.min(s.activeStone, s.stones.length - 1);
  const activeMonth = s.stones[active];
  const noun = isPendant ? "charm" : isEternity ? "color" : "diamond";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{isEternity ? "Colors in your pattern" : isPendant ? "BirthDiamond charms" : "Number of diamonds"}</div>
          {isEternity && (
            <div className="text-xs text-muted-foreground">
              {eternityStoneCount(design, s.ringSize, s.coverage)} diamonds repeat your pattern around the band
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-full border bg-card p-1">
          <Button variant="ghost" size="icon" className="size-8 rounded-full" disabled={idx <= 0} onClick={() => s.setStoneCount(counts[idx - 1])} aria-label={`Remove ${noun}`}>
            <Minus />
          </Button>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={s.stones.length} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="w-6 text-center text-base font-semibold tabular-nums">
              {s.stones.length}
            </motion.span>
          </AnimatePresence>
          <Button variant="ghost" size="icon" className="size-8 rounded-full" disabled={idx >= counts.length - 1} onClick={() => s.setStoneCount(counts[idx + 1])} aria-label={`Add ${noun}`}>
            <Plus />
          </Button>
        </div>
      </div>

      {isEternity && (
        <Segmented
          value={s.coverage}
          onChange={(coverage) => s.set({ coverage })}
          options={[
            { value: "half", label: "Half eternity" },
            { value: "full", label: "Full eternity" },
          ]}
        />
      )}

      {s.stones.length > 0 && (
        <>
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Select a {noun} to change its month</div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {s.stones.map((m, i) => {
                  const d = diamondFor(m);
                  const on = i === active;
                  return (
                    <motion.button
                      layout
                      key={i}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      onClick={() => s.setActiveStone(i)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition-colors",
                        on ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted",
                      )}
                    >
                      <span className="gem-swatch size-6 rounded-full" style={{ ["--gem" as string]: d.hex }} />
                      <span className="font-medium tabular-nums">{i + 1}</span>
                      <span className="text-muted-foreground">{d.monthName.slice(0, 3)}</span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">{noun[0].toUpperCase() + noun.slice(1)} {active + 1}: </span>
                <span className="font-medium">{diamondFor(activeMonth).monthName}</span>
                <span className="text-muted-foreground"> · {diamondFor(activeMonth).colorName}</span>
              </div>
              <button className="cursor-pointer text-xs text-primary hover:underline" onClick={() => s.setAllStones(activeMonth)}>
                Apply to all
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {BIRTH_DIAMONDS.map((d) => {
                const on = d.month === activeMonth;
                return (
                  <motion.button
                    key={d.month}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    title={`${d.monthName} — ${d.colorName}`}
                    onClick={() => s.setStoneMonth(active, d.month)}
                    className="group flex cursor-pointer flex-col items-center gap-1"
                  >
                    <span
                      className={cn(
                        "gem-swatch relative size-10 rotate-45 rounded-[0.6rem] transition-all",
                        on && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      )}
                      style={{ ["--gem" as string]: d.hex }}
                    >
                      {on && <Check className="absolute inset-0 m-auto size-4 -rotate-45 text-white drop-shadow" />}
                    </span>
                    <span className={cn("text-[11px] transition-colors", on ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {d.monthName.slice(0, 3)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function MetalStep() {
  const s = useConfigurator();
  const design = designById(s.designId);
  const metal = METALS.find((m) => m.id === s.metal)!;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2">
        {METALS.map((m) => {
          const on = m.id === s.metal;
          return (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => s.setMetal(m.id)}
              className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-2.5 transition-colors", on ? "border-primary ring-1 ring-primary" : "hover:bg-muted/60")}
            >
              <span className="size-10 rounded-full shadow-inner ring-1 ring-black/10" style={{ background: m.swatch }} />
              <span className="text-center text-[11px] leading-tight">{m.name}</span>
            </motion.button>
          );
        })}
      </div>
      <div>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Purity</div>
        <Segmented value={s.purity} onChange={(purity) => s.set({ purity })} options={metal.purities.map((p) => ({ value: p, label: PURITY_LABEL[p] }))} />
      </div>
      {design.category === "ring" && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Band profile</div>
          <div className="grid grid-cols-3 gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => s.set({ profile: p.id })}
                className={cn("cursor-pointer rounded-lg border p-2.5 text-left transition-colors", s.profile === p.id ? "border-primary ring-1 ring-primary" : "hover:bg-muted/60")}
              >
                <ProfileIcon id={p.id} />
                <div className="mt-1.5 text-xs font-medium">{p.name}</div>
                <div className="text-[11px] leading-tight text-muted-foreground">{p.note}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileIcon({ id }: { id: string }) {
  const d =
    id === "comfort"
      ? "M4 10 Q4 3 16 3 Q28 3 28 10 Q28 17 16 17 Q4 17 4 10Z"
      : id === "domed"
        ? "M4 15 Q4 3 16 3 Q28 3 28 15 L28 17 L4 17Z"
        : "M4 4 H28 V16 H4Z";
  return (
    <svg viewBox="0 0 32 20" className="h-5 w-8 text-primary">
      <path d={d} fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

export function SizeStep() {
  const s = useConfigurator();
  const design = designById(s.designId);
  if (design.category === "pendant") {
    return (
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Chain length</div>
        <Segmented value={s.chainLength} onChange={(chainLength) => s.set({ chainLength })} options={CHAIN_LENGTHS.map((c) => ({ value: c, label: `${c}"` }))} />
        <p className="text-xs text-muted-foreground">18&quot; sits just below the collarbone — our most popular length.</p>
      </div>
    );
  }
  const i = RING_SIZES.indexOf(s.ringSize);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-4xl leading-none tabular-nums">{s.ringSize}</div>
          <div className="mt-1 text-xs text-muted-foreground">US size · {ringDiameterMm(s.ringSize).toFixed(1)} mm inner diameter</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Circumference
          <div className="text-sm font-medium text-foreground tabular-nums">{(ringDiameterMm(s.ringSize) * Math.PI).toFixed(1)} mm</div>
        </div>
      </div>
      <Slider min={0} max={RING_SIZES.length - 1} step={1} value={[i]} onValueChange={([v]) => s.set({ ringSize: RING_SIZES[v] })} aria-label="Ring size" />
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>3</span>
        <span>5</span>
        <span>7</span>
        <span>9</span>
        <span>11</span>
        <span>13</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function EngraveStep() {
  const s = useConfigurator();
  const design = designById(s.designId);
  const sides = design.engravingSides;
  const side = Math.min(s.activeSide, sides.length - 1);
  const text = s.engraving[side] ?? "";

  const focusSide = (i: number) => {
    s.set({ activeSide: i });
    if (design.category === "pendant") s.goTo(i === 2 ? "inside" : i === 0 ? "front" : "side");
  };

  return (
    <div className="space-y-4">
      {sides.length > 1 && (
        <Segmented
          value={side}
          onChange={focusSide}
          options={sides.map((label, i) => ({
            value: i,
            label: (
              <span className="inline-flex items-center gap-1">
                {label}
                {s.engraving[i]?.trim() ? <span className="size-1.5 rounded-full bg-primary" /> : null}
              </span>
            ),
          }))}
        />
      )}
      <div className="relative">
        <Input
          value={text}
          maxLength={design.engravingMaxChars}
          placeholder={design.category === "pendant" ? "e.g. Olivia" : "e.g. Forever & Always"}
          onChange={(e) => s.setEngraving(side, e.target.value)}
          onFocus={() => (design.category === "ring" ? s.goTo("inside") : focusSide(side))}
          className="pr-14"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
          {text.length}/{design.engravingMaxChars}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(ENGRAVING_FONTS) as EngravingFontId[]).map((id) => {
          const f = ENGRAVING_FONTS[id];
          return (
            <button
              key={id}
              onClick={() => s.set({ font: id })}
              className={cn("cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors", s.font === id ? "border-primary ring-1 ring-primary" : "hover:bg-muted/60")}
            >
              <div className="truncate text-lg leading-tight" style={{ fontFamily: f.family, fontWeight: Number(f.weight) }}>
                {text || "Love you"}
              </div>
              <div className="text-[11px] text-muted-foreground">{f.label}</div>
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={() => (design.category === "ring" ? s.goTo("inside") : focusSide(side))}>
        <Eye /> Preview engraving in 3D
      </Button>
    </div>
  );
}

export function StepSummaryChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-[11rem] items-center gap-1 truncate text-xs text-muted-foreground">
      <Sparkles className="size-3 shrink-0 text-primary" />
      <span className="truncate">{children}</span>
    </span>
  );
}
