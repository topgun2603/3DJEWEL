import { NextResponse } from "next/server";
import { designById, METALS } from "@/lib/catalog";
import { quote, type JewelryConfig } from "@/lib/pricing";
import { tenantById } from "@/lib/tenants";

/**
 * Authoritative server-side price. The storefront calls this at checkout so a
 * tampered client price can never reach an order.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { retailer?: string; config?: JewelryConfig } | null;
  const tenant = body?.retailer ? tenantById(body.retailer) : undefined;
  if (!tenant) return NextResponse.json({ error: "Unknown retailer" }, { status: 404 });

  const config = body?.config;
  const design = config && designById(config.designId);
  const metal = config && METALS.find((m) => m.id === config.metal);
  const valid =
    config &&
    design?.id === config.designId &&
    tenant.designs.includes(design.id) &&
    metal?.purities.includes(config.purity) &&
    Array.isArray(config.stones) &&
    design.stoneCounts.includes(config.stones.length) &&
    config.stones.every((m) => Number.isInteger(m) && m >= 1 && m <= 12) &&
    Array.isArray(config.engraving) &&
    config.engraving.every((t) => typeof t === "string" && t.length <= design.engravingMaxChars);
  if (!valid) return NextResponse.json({ error: "Invalid configuration" }, { status: 400 });

  return NextResponse.json(quote(config, tenant), { headers: { "Access-Control-Allow-Origin": "*" } });
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
