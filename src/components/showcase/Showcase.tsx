"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Code2, Copy, Diamond, Settings2, ShoppingBag, Store, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Configurator, PriceTable, type CartLine } from "@/components/configurator/Configurator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { DESIGNS } from "@/lib/catalog";
import { quote } from "@/lib/pricing";
import { selectConfig, useConfigurator } from "@/lib/store";
import { TENANTS, type Rounding, type Tenant } from "@/lib/tenants";
import { cn, formatMoney } from "@/lib/utils";

export function Showcase() {
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS);
  const [tenantId, setTenantId] = useState(TENANTS[0].id);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("retailer");
    if (id && TENANTS.some((t) => t.id === id)) setTenantId(id);
  }, []);
  const [panel, setPanel] = useState<"" | "console" | "embed" | "bag">("");
  const [bag, setBag] = useState<CartLine[]>([]);
  const tenant = tenants.find((t) => t.id === tenantId)!;
  const surface = tenant.theme.surface;
  const accentVars = {
    "--accent-color": tenant.theme.accent,
    "--accent-foreground": tenant.theme.accentForeground,
  } as React.CSSProperties;

  const update = (patch: Partial<Tenant>) => setTenants((all) => all.map((t) => (t.id === tenantId ? { ...t, ...patch } : t)));

  return (
    <div data-surface={surface} style={accentVars} className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh">
      <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Diamond className="size-4" />
          </span>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold">BirthDiamond Studio</div>
            <div className="text-[11px] text-muted-foreground">White-label 3D configurator · demo</div>
          </div>
        </div>

        <div className="mx-auto flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full bg-muted p-1 sm:flex-none">
          <Store className="ml-2 mr-1 hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => setTenantId(t.id)}
              className={cn("relative shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors", t.id === tenantId ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t.id === tenantId && <motion.span layoutId="tenant-pill" className="absolute inset-0 rounded-full bg-card shadow-sm ring-1 ring-border" />}
              <span className="relative flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: t.theme.accent }} />
                {t.name}
              </span>
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setPanel("console")} aria-label="Retailer console">
            <Settings2 /> <span className="hidden md:inline">Retailer console</span>
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setPanel("embed")}>
            <Code2 /> <span className="hidden md:inline">Embed</span>
          </Button>
          <Button variant="outline" size="icon" className="relative rounded-full" onClick={() => setPanel("bag")} aria-label="Bag">
            <ShoppingBag />
            <AnimatePresence>
              {bag.length > 0 && (
                <motion.span
                  key={bag.length}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
                >
                  {bag.length}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Configurator key={tenant.id} tenant={tenant} onAddToCart={(line) => setBag((b) => [...b, line])} />
      </main>

      <Dialog open={panel === "console"} onOpenChange={(o) => setPanel(o ? "console" : "")}>
        <DialogContent side="right" data-surface={surface} style={accentVars}>
          <RetailerConsole tenant={tenant} update={update} />
        </DialogContent>
      </Dialog>

      <Dialog open={panel === "embed"} onOpenChange={(o) => setPanel(o ? "embed" : "")}>
        <DialogContent data-surface={surface} style={accentVars} className="max-w-2xl">
          <EmbedCode tenant={tenant} />
        </DialogContent>
      </Dialog>

      <Dialog open={panel === "bag"} onOpenChange={(o) => setPanel(o ? "bag" : "")}>
        <DialogContent side="right" data-surface={surface} style={accentVars}>
          <DialogHeader>
            <DialogTitle>Your bag</DialogTitle>
            <DialogDescription>Each line carries the full configuration, so the retailer can produce it exactly.</DialogDescription>
          </DialogHeader>
          {bag.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Your bag is empty.</div>
          ) : (
            <div className="space-y-3">
              {bag.map((line) => (
                <motion.div layout key={line.id} className="flex gap-3 rounded-lg border p-3">
                  {line.image && <img src={line.image} alt="" className="size-20 rounded-md object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <div className="font-medium">{line.title}</div>
                      <div className="tabular-nums">{formatMoney(line.quote.retail, line.quote.currency, tenant.locale)}</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{line.summary}</div>
                    <button onClick={() => setBag((b) => b.filter((x) => x.id !== line.id))} className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                </motion.div>
              ))}
              <Button size="lg" className="w-full rounded-full" onClick={() => toast("Checkout hands off to the retailer's cart (Shopify, WooCommerce or custom).")}>
                Checkout · {formatMoney(bag.reduce((s, l) => s + l.quote.retail, 0), tenant.currency, tenant.locale)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ROUNDING: { value: Rounding; label: string }[] = [
  { value: "none", label: "Exact" },
  { value: "whole", label: "Whole" },
  { value: "ninety-nine", label: ".99" },
  { value: "five", label: "Nearest 5" },
];

function RetailerConsole({ tenant, update }: { tenant: Tenant; update: (p: Partial<Tenant>) => void }) {
  const config = useConfigurator(useShallow(selectConfig));
  const q = useMemo(() => quote(config, tenant), [config, tenant]);
  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary">Retailer console</div>
        <DialogTitle>{tenant.name}</DialogTitle>
        <DialogDescription>Each retailer sets its own markup, rounding and assortment. Changes apply live to the configurator.</DialogDescription>
      </DialogHeader>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-medium">Markup over wholesale</div>
          <div className="font-display text-2xl tabular-nums">{tenant.markupPct}%</div>
        </div>
        <Slider min={0} max={300} step={5} value={[tenant.markupPct]} onValueChange={([v]) => update({ markupPct: v })} aria-label="Markup" />
      </section>

      <section className="space-y-2">
        <div className="text-sm font-medium">Price rounding</div>
        <Segmented value={tenant.rounding} onChange={(rounding) => update({ rounding })} options={ROUNDING} />
      </section>

      <section className="space-y-2">
        <div className="text-sm font-medium">Designs offered</div>
        <div className="space-y-1.5">
          {DESIGNS.map((d) => {
            const on = tenant.designs.includes(d.id);
            const toggle = () => {
              const next = on ? tenant.designs.filter((x) => x !== d.id) : [...tenant.designs, d.id];
              if (next.length) update({ designs: DESIGNS.map((x) => x.id).filter((id) => next.includes(id)) });
            };
            return (
              <button key={d.id} onClick={toggle} className="flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/50">
                <span className={cn("grid size-5 place-items-center rounded border transition-colors", on && "border-primary bg-primary text-primary-foreground")}>
                  {on && <Check className="size-3" />}
                </span>
                <span className="flex-1">{d.name}</span>
                <span className="text-xs capitalize text-muted-foreground">{d.category}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-sm font-medium">Current piece — live quote</div>
        <PriceTable q={q} locale={tenant.locale} showWholesale />
      </section>
    </div>
  );
}

function EmbedCode({ tenant }: { tenant: Tenant }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://studio.example.com";
  const [tab, setTab] = useState<"script" | "iframe" | "api">("script");
  const snippets = {
    script: `<!-- ${tenant.name}: BirthDiamond configurator -->
<div data-birthdiamond data-retailer="${tenant.id}" style="height:780px"></div>
<script src="${origin}/embed.js" async></script>

<script>
  // Fired when a shopper clicks "Add to bag" inside the configurator
  window.addEventListener("birthdiamond:add-to-cart", (e) => {
    const { line } = e.detail;      // config + quote + preview image
    // e.g. Shopify: fetch("/cart/add.js", { method: "POST", body: ... })
  });
</script>`,
    iframe: `<iframe
  src="${origin}/embed/${tenant.id}"
  style="width:100%;height:780px;border:0;border-radius:16px"
  allow="clipboard-write"
  title="Design your BirthDiamond jewelry"></iframe>`,
    api: `POST ${origin}/api/price
Content-Type: application/json

{
  "retailer": "${tenant.id}",
  "config": {
    "designId": "aria", "stones": [2, 4, 9],
    "metal": "yellow", "purity": "14k", "ringSize": 7,
    "chainLength": 18, "profile": "comfort", "coverage": "half",
    "engraving": ["Forever"], "font": "script"
  }
}
// → { retail, wholesale, currency, lines[] }  (server-side, tamper-proof)`,
  };
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Install on any storefront</DialogTitle>
        <DialogDescription>One configurator, many retailers. Drop in the script tag, an iframe, or use the pricing API directly. Also try the sample retailer site at /demo-store.html.</DialogDescription>
      </DialogHeader>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "script", label: "Script widget" },
          { value: "iframe", label: "iFrame" },
          { value: "api", label: "Pricing API" },
        ]}
      />
      <div className="relative">
        <pre className="scrollbar-thin max-h-80 overflow-auto rounded-lg bg-[#14120f] p-4 text-xs leading-relaxed text-[#eadfcf]">
          <code>{snippets[tab]}</code>
        </pre>
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-2 top-2"
          onClick={() => {
            navigator.clipboard?.writeText(snippets[tab]);
            toast.success("Copied");
          }}
        >
          <Copy /> Copy
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`/embed/${tenant.id}`} target="_blank" rel="noreferrer">Open embed view</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/demo-store.html" target="_blank" rel="noreferrer">Open sample retailer site</a>
        </Button>
      </div>
    </div>
  );
}
