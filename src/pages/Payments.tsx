import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Wallet, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchPagos } from "@/lib/api/pagos";
import type { Pago } from "@/types/pago";

const formatAmount = (value: number, currency?: string | null) => {
  const formatter = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
};

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { items, totalPages: totalPagesMeta } = await fetchPagos({ page, limit });
        if (cancelled) return;
        setPayments(items);
        setTotalPages(totalPagesMeta ?? 1);
      } catch (e: any) {
        if (cancelled) return;
        const message = e?.status === 403
          ? "Acceso denegado: el pago pertenece a otro tenant"
          : e?.message || "No se pudieron cargar los pagos";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [limit, page]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter((payment) => {
      const clinicName = payment.clinica?.nombre ?? "";
      const tenantLabel = payment.tenant?.nombre || payment.tenant?.slug || payment.clinica?.tenant?.nombre || payment.clinica?.tenant?.slug || "";
      return [
        payment.id_pago,
        clinicName,
        tenantLabel,
        payment.descripcion ?? "",
        payment.estado ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [payments, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
          <p className="text-muted-foreground">Historial de pagos por tenant y clinica</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refrescar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Buscar pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por clinica, tenant, descripcion..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="pt-6">Cargando pagos...</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {filtered.map((payment) => {
          const clinicName = payment.clinica?.nombre ?? "Sin clinica";
          const tenantLabel = payment.tenant?.nombre || payment.tenant?.slug || payment.clinica?.tenant?.nombre || payment.clinica?.tenant?.slug || "Sin tenant";
          const amount = formatAmount(payment.monto ?? 0, payment.moneda);

          return (
            <Card key={payment.id_pago} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Pago #{payment.id_pago}</h2>
                    <p className="text-sm text-muted-foreground">{payment.descripcion || "Sin descripcion"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-foreground">{amount}</p>
                    <p className="text-xs text-muted-foreground">{payment.fecha_pago || "Sin fecha"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Estado:</span> {payment.estado || "Sin estado"}
                  </div>
                  <div>
                    <span className="font-medium">Clinica:</span> {clinicName}
                  </div>
                  <div>
                    <span className="font-medium">Tenant:</span> {tenantLabel}
                  </div>
                  <div>
                    <span className="font-medium">Metodo:</span> {payment.metodo_pago || "Sin metodo"}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && !error && filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No se encontraron pagos que coincidan con la busqueda.
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-center items-center gap-4">
        <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Pagina {page} de {totalPages}</span>
        <Button variant="outline" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default PaymentsPage;
