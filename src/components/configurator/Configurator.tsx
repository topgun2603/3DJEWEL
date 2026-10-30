"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import {
  Camera,
  ChevronDown,
  Gem,
  Hand,
  Link2,
  Loader2,
  Pause,
  Play,
  Receipt,
  Ruler,
  ShoppingBag,
  Sparkle,
  Type,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DESIGNS, designById, diamondFor, metalById, PURITY_LABEL } from "@/lib/catalog";
import { ENGRAVING_FONTS } from "@/lib/fonts";
import { quote, type JewelryConfig, type Quote } from "@/lib/pricing";
import { decodeConfig, encodeConfig, selectConfig, useConfigurator, type CameraView } from "@/lib/store";
import type { Tenant } from "@/lib/tenants";
import { cn, formatMoney } from "@/lib/utils";
import { DesignGlyph, DesignStep, DiamondStep, EngraveStep, MetalStep, SizeStep } from "./steps";

const Stage = dynamic(() => import("@/components/three/Stage"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  ),
});

export interface CartLine {
  id: string;
  config: JewelryConfig;
  quote: Quote;
  title: string;
  summary: string;
  image: string;
}

export const CART_EVENT = "birthdiamond:add-to-cart";

function describe(config: JewelryConfig) {
  const design = designById(config.designId);
  const metal = metalById(config.metal);
  const parts = [`${PURITY_LABEL[config.purity]} ${metal.name}`];
  if (config.stones.length) parts.push(config.stones.map((m) => diamondFor(m).monthName.slice(0, 3)).join(" · "));
  parts.push(design.category === "ring" ? `Size ${config.ringSize}` : `${config.chainLength}" chain`);
  const engraved = config.engraving.filter((t) => t.trim());
  if (engraved.length) parts.push(`“${engraved.join(" / ")}”`);
  return parts.join(" — ");
}

function AnimatedPrice({ value, currency, locale }: { value: number; currency: string; locale: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatMoney(Math.round(v * 100) / 100, currency, locale));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [value, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

const VIEWS: { id: CameraView; ring: string; pendant: string }[] = [
  { id: "hero", ring: "Hero", pendant: "Hero" },
  { id: "front", ring: "Front", pendant: "Front" },
  { id: "top", ring: "Top", pendant: "Charms" },
  { id: "side", ring: "Side", pendant: "Side" },
  { id: "inside", ring: "Inside", pendant: "Back" },
];

function Viewer({ tenant, title, tagline }: { tenant: Tenant; title: string; tagline: string }) {
  const s = useConfigurator(
    useShallow((st) => ({ view: st.view, autoRotate: st.autoRotate, goTo: st.goTo, set: st.set, designId: st.designId })),
  );
  const config = useConfigurator(useShallow(selectConfig));
  const category = designById(s.designId).category;

  const screenshot = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("[data-stage] canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${s.designId}-birthdiamond.png`;
    a.click();
  };

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("d", encodeConfig(config));
    await navigator.clipboard?.writeText(url.toString()).catch(() => {});
    window.history.replaceState(null, "", url);
    toast.success("Design link copied", { description: "Anyone with the link sees this exact piece." });
  };

  return (
    <section data-stage className="relative h-full min-h-[52vh] overflow-hidden" style={{ background: tenant.theme.stage }}>
      <Stage stage={tenant.theme.stage} accent={tenant.theme.accent} surface={tenant.theme.surface} />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 50% 45%, transparent 55%, ${tenant.theme.stage} 100%)` }}
      />

      <div className="pointer-events-none absolute left-5 top-5 max-w-[60%] sm:left-8 sm:top-7">
        <AnimatePresence mode="wait">
          <motion.div key={title} initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(6px)" }} transition={{ duration: 0.45 }}>
            <div className="text-[11px] uppercase tracking-[0.25em] text-primary">BirthDiamond Collection</div>
            <h1 className="font-display mt-1 text-3xl font-medium leading-none sm:text-5xl">{title}</h1>
            <p className="mt-2 hidden text-sm text-muted-foreground sm:block">{tagline}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="absolute right-4 top-4 flex flex-col gap-2 sm:right-6 sm:top-6">
          {[
            { icon: Camera, label: "Save image", onClick: screenshot },
            { icon: Link2, label: "Copy share link", onClick: share },
            {
              icon: s.autoRotate ? Pause : Play,
              label: s.autoRotate ? "Pause rotation" : "Auto-rotate",
              onClick: () => s.set({ autoRotate: !s.autoRotate }),
            },
          ].map(({ icon: Icon, label, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="glass rounded-full border-border/60" onClick={onClick} aria-label={label}>
                  <Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4 sm:bottom-6">
        <div className="glass flex rounded-full border border-border/60 p-1 shadow-lg">
          {VIEWS.map((v) => {
            const on = s.view.name === v.id;
            return (
              <button key={v.id} onClick={() => s.goTo(v.id)} className={cn("relative cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4", on ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {on && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{v[category]}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Hand className="size-3.5 shrink-0" /> Drag to rotate · zoom · tap a diamond to recolor it
        </div>
      </div>
    </section>
  );
}

interface StepDef {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  body: React.ReactNode;
}

export function Configurator({
  tenant,
  embedded = false,
  onAddToCart,
}: {
  tenant: Tenant;
  embedded?: boolean;
  onAddToCart?: (line: CartLine) => void;
}) {
  const config = useConfigurator(useShallow(selectConfig));
  const { load, setDesign } = useConfigurator(useShallow((s) => ({ load: s.load, setDesign: s.setDesign })));
  const designs = useMemo(() => DESIGNS.filter((d) => tenant.designs.includes(d.id)), [tenant.designs]);
  const design = designById(config.designId);
  const q = useMemo(() => quote(config, tenant), [config, tenant]);
  const [open, setOpen] = useState("diamonds");
  const [details, setDetails] = useState(false);
  const [adding, setAdding] = useState(false);

  // Restore a shared design (?d=...) once, otherwise make sure the design is sold by this retailer.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("d");
    const shared = token ? decodeConfig(token) : null;
    if (shared?.designId && tenant.designs.includes(shared.designId)) load(shared);
    const view = params.get("view") as CameraView | null;
    if (view && VIEWS.some((v) => v.id === view)) useConfigurator.getState().goTo(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!tenant.designs.includes(config.designId) && designs[0]) setDesign(designs[0].id);
  }, [tenant.designs, config.designId, designs, setDesign]);

  const metal = metalById(config.metal);
  const engraved = config.engraving.filter((t) => t.trim());
  const steps: StepDef[] = [
    { id: "design", title: "Design", icon: Sparkle, summary: design.name, body: <DesignStep designs={designs} /> },
    {
      id: "diamonds",
      title: design.category === "pendant" ? "BirthDiamond charms" : "BirthDiamonds",
      icon: Gem,
      summary: config.stones.length ? config.stones.map((m) => diamondFor(m).monthName.slice(0, 3)).join(", ") : "None",
      body: <DiamondStep />,
    },
    { id: "metal", title: "Metal & purity", icon: Receipt, summary: `${PURITY_LABEL[config.purity]} ${metal.name}`, body: <MetalStep /> },
    {
      id: "size",
      title: design.category === "pendant" ? "Chain length" : "Ring size",
      icon: Ruler,
      summary: design.category === "pendant" ? `${config.chainLength}"` : `US ${config.ringSize}`,
      body: <SizeStep />,
    },
    {
      id: "engrave",
      title: "Engraving",
      icon: Type,
      summary: engraved.length ? `“${engraved[0]}” · ${ENGRAVING_FONTS[config.font].label}` : "Optional",
      body: <EngraveStep />,
    },
  ];

  const addToCart = async () => {
    setAdding(true);
    await new Promise((r) => setTimeout(r, 450));
    const canvas = document.querySelector<HTMLCanvasElement>("[data-stage] canvas");
    let image = "";
    if (canvas) {
      const thumb = document.createElement("canvas");
      thumb.width = 320;
      thumb.height = Math.round((320 * canvas.height) / canvas.width);
      thumb.getContext("2d")!.drawImage(canvas, 0, 0, thumb.width, thumb.height);
      image = thumb.toDataURL("image/jpeg", 0.85);
    }
    const line: CartLine = {
      id: crypto.randomUUID(),
      config,
      quote: q,
      title: design.name,
      summary: describe(config),
      image,
    };
    // When embedded, the host storefront listens for this message (see /embed.js).
    if (embedded && window.parent !== window) {
      window.parent.postMessage({ type: CART_EVENT, tenant: tenant.id, line }, "*");
    }
    onAddToCart?.(line);
    setAdding(false);
    toast.success(`${design.name} added to bag`, {
      description: `${describe(config)} · ${formatMoney(q.retail, q.currency, tenant.locale)}`,
    });
  };

  return (
    <div
      data-surface={tenant.theme.surface}
      className="grid grid-cols-1 grid-rows-[56vh_auto] bg-background text-foreground lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] lg:grid-rows-1"
      style={
        {
          "--accent-color": tenant.theme.accent,
          "--accent-foreground": tenant.theme.accentForeground,
        } as React.CSSProperties
      }
    >
      <Viewer tenant={tenant} title={design.name} tagline={design.tagline} />

      <aside className="flex flex-col border-t bg-card lg:min-h-0 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <DesignGlyph design={design} months={config.stones} className="size-10 text-primary" />
          <div className="min-w-0">
            <div className="truncate font-display text-xl leading-tight">{tenant.name}</div>
            <div className="truncate text-xs text-muted-foreground">{tenant.tagline} · Custom BirthDiamond jewelry</div>
          </div>
        </div>

        <div className="scrollbar-thin lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {steps.map((step, i) => {
            const isOpen = open === step.id;
            const Icon = step.icon;
            return (
              <div key={step.id} className="border-b">
                <button onClick={() => setOpen(isOpen ? "" : step.id)} className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors", isOpen ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground")}>
                    {isOpen ? <Icon className="size-4" /> : i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{step.title}</span>
                    {!isOpen && <span className="block truncate text-xs text-muted-foreground">{step.summary}</span>}
                  </span>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 pt-1">{step.body}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 border-t bg-card px-5 py-4 shadow-[0_-12px_30px_-20px_rgba(0,0,0,0.35)]">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-xs text-muted-foreground">
                {q.stoneCount} BirthDiamond{q.stoneCount === 1 ? "" : "s"} · {q.totalCarat.toFixed(2)} ct t.w. · {PURITY_LABEL[config.purity]} {metal.name}
              </div>
              <button onClick={() => setDetails(true)} className="mt-0.5 cursor-pointer text-xs text-primary hover:underline">
                Price details
              </button>
            </div>
            <div className="font-display text-3xl font-medium leading-none">
              <AnimatedPrice value={q.retail} currency={q.currency} locale={tenant.locale} />
            </div>
          </div>
          <Button size="lg" className="w-full rounded-full text-base" onClick={addToCart} disabled={adding}>
            {adding ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
            Add to bag
          </Button>
          <div className="mt-2 text-center text-[11px] text-muted-foreground">Handcrafted to order · Ships in 2–3 weeks · Free resizing</div>
        </div>
      </aside>

      <Dialog open={details} onOpenChange={setDetails}>
        <DialogContent
          data-surface={tenant.theme.surface}
          style={{ "--accent-color": tenant.theme.accent, "--accent-foreground": tenant.theme.accentForeground } as React.CSSProperties}
        >
          <DialogHeader>
            <DialogTitle>Price details</DialogTitle>
            <DialogDescription>{describe(config)}</DialogDescription>
          </DialogHeader>
          <PriceTable q={q} locale={tenant.locale} showWholesale={!embedded} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PriceTable({ q, locale, showWholesale }: { q: Quote; locale: string; showWholesale: boolean }) {
  const ratio = q.wholesale ? q.retail / q.wholesale : 1;
  return (
    <div className="space-y-3 text-sm">
      <div className="divide-y rounded-lg border">
        {q.lines.map((l) => (
          <div key={l.label} className="flex items-start justify-between gap-4 px-3 py-2.5">
            <div>
              <div>{l.label}</div>
              {showWholesale && l.detail && <div className="text-xs text-muted-foreground">{l.detail}</div>}
            </div>
            <div className="tabular-nums">{formatMoney(showWholesale ? l.amount : Math.round(l.amount * ratio), q.currency, locale)}</div>
          </div>
        ))}
      </div>
      {showWholesale && (
        <div className="space-y-1 rounded-lg bg-muted px-3 py-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wholesale cost</span>
            <span className="tabular-nums">{formatMoney(q.wholesale, q.currency, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Retailer markup</span>
            <span className="tabular-nums">+{q.markupPct}%</span>
          </div>
        </div>
      )}
      <div className="flex items-baseline justify-between pt-1">
        <span className="font-medium">Your price</span>
        <span className="font-display text-2xl tabular-nums">{formatMoney(q.retail, q.currency, locale)}</span>
      </div>
      {showWholesale && <p className="text-[11px] text-muted-foreground">Wholesale lines are visible in this demo only — shoppers on a retailer site see retail amounts.</p>}
    </div>
  );
}
