import { Link } from "react-router-dom";
import { Building2, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clinic } from "@/servicios/clinicas";

interface ClinicsTableProps {
  clinics: Clinic[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  limit?: number;
  showCreateButton?: boolean;
  showViewAllLink?: boolean;
  compact?: boolean;
}

const ClinicsTable = ({
  clinics,
  loading,
  error,
  onRetry,
  limit,
  showCreateButton = true,
  showViewAllLink = false,
  compact = false,
}: ClinicsTableProps) => {
  const displayedClinics = typeof limit === "number" ? clinics.slice(0, limit) : clinics;
  const activeCount = clinics.filter((clinic) => clinic.activo).length;
  const total = clinics.length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            Clinicas registradas
          </CardTitle>
          <CardDescription>
            {total > 0 ? `${activeCount} activas de ${total} registradas` : "Aun no se han registrado clinicas"}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {showViewAllLink && total > 0 ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/clinics">Ver todas</Link>
            </Button>
          ) : null}
          {showCreateButton ? (
            <Button size="sm" asChild>
              <Link to="/clinics/new">
                <Plus className="h-4 w-4 mr-1" />
                Nueva clinica
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando clinicas...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-red-600">{error}</p>
            {onRetry ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            ) : null}
          </div>
        ) : displayedClinics.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay clinicas registradas todavia.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Direccion</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedClinics.map((clinic) => (
                <TableRow key={clinic.id} className={compact ? "text-sm" : undefined}>
                  <TableCell className="font-medium">{clinic.nombre}</TableCell>
                  <TableCell>{clinic.direccion ?? "--"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {clinic.telefono ? <span>{clinic.telefono}</span> : null}
                      {clinic.correo ? <span className="text-xs text-muted-foreground">{clinic.correo}</span> : null}
                      {!clinic.telefono && !clinic.correo ? <span className="text-muted-foreground">--</span> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={clinic.activo ? "default" : "secondary"}>
                      {clinic.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicsTable;


