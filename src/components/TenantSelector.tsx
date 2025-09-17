import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getTenantSlug, setTenantSlug } from "@/lib/tenant";
import { toast } from "sonner";

export default function TenantSelector() {
  const qc = useQueryClient();
  const [slug, setSlug] = useState<string>(getTenantSlug() || (import.meta.env.DEV ? "default" : ""));

  useEffect(() => {
    // Keep local state in sync if external code changed it
    const current = getTenantSlug();
    if (current && current !== slug) setSlug(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = async () => {
    const next = window.prompt("Cambiar tenant (slug)", slug || "default");
    if (!next) return;
    const clean = next.trim();
    if (!clean) return;
    setTenantSlug(clean);
    setSlug(clean);
    try { await qc.clear(); } catch {}
    toast.success(`Tenant activo: ${clean}`);
    // Forzar recarga de vistas que usan fetch en vez de react-query
    try { window.location.reload(); } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">Tenant:</span>
      <Button variant="outline" size="sm" onClick={change} title="Cambiar tenant">
        {slug || "(sin tenant)"}
      </Button>
    </div>
  );
}

