import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/api/client";
import { Search, User, IdCard, Mail } from "lucide-react";
import { toast } from "sonner";

interface Paciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
  numero_cedula?: string;
  email?: string;
  fecha_nacimiento?: string;
}

interface PatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient?: (paciente: Paciente) => void;
}

const PatientSearchModal: React.FC<PatientSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
}) => {
const [filtros, setFiltros] = useState({
  nombres: "",
  apellidos: "",
  numero_cedula: "",
  email: "",
});
  
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFilterChange = (field: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      // Construir los parámetros de búsqueda
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      const searchTokens: string[] = [];

      const addToken = (value: string) => {
        const trimmed = value.trim();
        if (trimmed) {
          searchTokens.push(trimmed);
          return trimmed;
        }
        return "";
      };

      if (addToken(filtros.nombres)) {
        params.nombres = filtros.nombres.trim();
      }
      if (addToken(filtros.apellidos)) {
        params.apellidos = filtros.apellidos.trim();
      }
      if (addToken(filtros.numero_cedula)) {
        params.numero_cedula = filtros.numero_cedula.trim();
      }
      if (addToken(filtros.email)) {
        params.email = filtros.email.trim();
      }

      if (searchTokens.length > 0) {
        params.search = searchTokens.join(" ");
      }

      const response = await apiGet<any>("/pacientes", params);
      
      let pacientesList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      pacientesList = pacientesList.map((paciente: any) => {
        const numero_cedula =
          paciente.numero_cedula ??
          paciente.documento_identidad ??
          paciente.identificacion ??
          paciente.cedula ??
          paciente.documento ??
          null;
        const email =
          paciente.email ??
          paciente.correo ??
          paciente.email_contacto ??
          paciente.mail ??
          null;
        return {
          ...paciente,
          numero_cedula,
          email,
        };
      });

      // Filtrado local adicional para asegurar que solo se muestren coincidencias exactas
      const filtroNombre = filtros.nombres.trim().toLowerCase();
      const filtroApellido = filtros.apellidos.trim().toLowerCase();
      const filtroCedula = filtros.numero_cedula.trim();
      const filtroEmail = filtros.email.trim().toLowerCase();

      pacientesList = pacientesList.filter((paciente: Paciente & Record<string, any>) => {
        const matchNombres =
          !filtroNombre ||
          paciente.nombres?.toLowerCase().includes(filtroNombre);
        const matchApellidos =
          !filtroApellido ||
          paciente.apellidos?.toLowerCase().includes(filtroApellido);
        const cedulaValor =
          paciente.numero_cedula ??
          paciente.documento_identidad ??
          paciente.identificacion ??
          paciente.cedula ??
          paciente.documento ??
          "";
        const matchCedula =
          !filtroCedula || String(cedulaValor).includes(filtroCedula);
        const emailValor =
          paciente.email ??
          paciente.correo ??
          paciente.email_contacto ??
          "";
        const matchEmail =
          !filtroEmail ||
          String(emailValor).toLowerCase().includes(filtroEmail);

        return (
          matchNombres &&
          matchApellidos &&
          matchCedula &&
          matchEmail
        );
      });

      setPacientes(pacientesList);
      
      if (pacientesList.length === 0) {
        toast.info("No se encontraron pacientes con los criterios de búsqueda");
      }
    } catch (error) {
      console.error("Error buscando pacientes:", error);
      toast.error("Error al buscar pacientes");
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFiltros({
      nombres: "",
      apellidos: "",
      numero_cedula: "",
      email: "",
    });
    setPacientes([]);
    setHasSearched(false);
  };

  const handleSelectPatient = (paciente: Paciente) => {
    if (onSelectPatient) {
      onSelectPatient(paciente);
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      handleClear();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Paciente
          </DialogTitle>
          <DialogDescription>
            Ingrese los datos para buscar pacientes en el sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros de búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="nombres" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombres
              </Label>
              <Input
                id="nombres"
                placeholder="Ingrese nombres"
                value={filtros.nombres}
                onChange={(e) => handleFilterChange("nombres", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Apellidos
              </Label>
              <Input
                id="apellidos"
                placeholder="Ingrese apellidos"
                value={filtros.apellidos}
                onChange={(e) => handleFilterChange("apellidos", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_cedula" className="flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Número de Cédula
              </Label>
              <Input
                id="numero_cedula"
                placeholder="Ej: 1234567890"
                value={filtros.numero_cedula}
                onChange={(e) => handleFilterChange("numero_cedula", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: paciente@example.com"
                value={filtros.email}
                onChange={(e) => handleFilterChange("email", e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              Limpiar
            </Button>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {/* Tabla de resultados */}
          {hasSearched && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Nombres</TableHead>
                    <TableHead>Apellidos</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="text-gray-500">Buscando pacientes...</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pacientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <User className="h-8 w-8 text-gray-400" />
                          <div className="text-gray-500">No se encontraron pacientes</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pacientes.map((paciente) => (
                      <TableRow key={paciente.id_paciente}>
                        <TableCell>{paciente.numero_cedula || "N/A"}</TableCell>
                        <TableCell>{paciente.nombres}</TableCell>
                        <TableCell>{paciente.apellidos}</TableCell>
                        <TableCell>{paciente.email || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSelectPatient(paciente)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientSearchModal;
