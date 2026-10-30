# BirthDiamond Studio — 3D jewelry configurator (demo)

A white-label, real-time 3D configurator for BirthDiamond rings and pendants. One
codebase serves many retailers, each with its own branding, assortment and markup.

```bash
npm install
npm run dev        # http://localhost:3000
```

| URL | What it is |
| --- | --- |
| `/` | Showcase: switch retailers, open the **Retailer console** (markup, rounding, assortment), **Embed** codes, bag |
| `/embed/{retailer}` | The configurator alone — what retailers iframe into their site |
| `/demo-store.html` | A simulated third-party retailer site using the one-line embed |
| `POST /api/price` | Server-side, tamper-proof price for a configuration + retailer |

Deep links: `?retailer=bloom`, `?view=top|front|side|inside|hero`, `?d=<shared design token>` (from the share button).

## Stack

Next.js (App Router) · React Three Fiber + drei (WebGL) · Tailwind CSS v4 · shadcn-style
components on Radix · framer-motion · zustand.

## How it is put together

- `src/lib/catalog.ts` — birth-month diamond colors and $/ct, metals and purities, ring sizes, and **designs** (stone layout, cut, setting, metal weight, labor).
- `src/lib/pricing.ts` — `quote(config, retailer)`: metal g × $/g (by purity, scaled by size / chain), carats × $/ct per color, setting and engraving fees, labor → wholesale; then the retailer's markup and rounding → retail. Shared by the UI (instant updates) and the API (authoritative).
- `src/lib/tenants.ts` — retailers: theme, markup %, rounding, currency, enabled designs.
- `src/components/three/` — procedural 3D: faceted diamonds for any outline (round, baguette, emerald, heart…), ray-traced refraction with dispersion, prong / bezel / channel settings, comfort / domed / flat bands, engraving rendered into the metal, bar pendant with chain and swinging charms.
- `public/embed.js` — drop-in loader. Emits `birthdiamond:add-to-cart` with the full configuration, quote and a preview image so the host shop (Shopify, WooCommerce, custom) can add the line to its own cart.

## Production path (not in this demo)

- **CAD → GLB**: replace procedural geometry per design with optimized GLB exports of the supplied CAD, with named nodes (`metal`, `stone_1…n`) so the same color/metal logic applies.
- **Admin + database** for catalog, price lists and retailers (currently TypeScript constants).
- **Shopify app**: theme app extension wrapping the embed, plus a cart transform / draft-order flow priced via `/api/price`.
