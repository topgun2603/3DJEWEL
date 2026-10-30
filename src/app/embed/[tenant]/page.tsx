import { notFound } from "next/navigation";
import { EmbedClient } from "./EmbedClient";
import { TENANTS, tenantById } from "@/lib/tenants";

export function generateStaticParams() {
  return TENANTS.map((t) => ({ tenant: t.id }));
}

export default async function EmbedPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: id } = await params;
  const tenant = tenantById(id);
  if (!tenant) notFound();
  return <EmbedClient tenant={tenant} />;
}
