"use client";

import { Configurator } from "@/components/configurator/Configurator";
import type { Tenant } from "@/lib/tenants";

export function EmbedClient({ tenant }: { tenant: Tenant }) {
  return (
    <div className="min-h-dvh lg:h-dvh">
      <Configurator tenant={tenant} embedded />
    </div>
  );
}
