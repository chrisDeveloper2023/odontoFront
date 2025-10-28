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
import { Search, User, Phone, IdCard, Mail } from "lucide-react";
import { toast } from "sonner";

interface Paciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
  numero_celular?: string;
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
    numero_celular: "",
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
      const params: any = { page: 1, limit: 100 };
      
      if (filtros.nombres.trim()) {
        params.nombres = filtros.nombres.trim();
      }
      if (filtros.apellidos.trim()) {
        params.apellidos = filtros.apellidos.trim();
      }
      if (filtros.numero_celular.trim()) {
        params.numero_celular = filtros.numero_celular.trim();
      }
      if (filtros.numero_cedula.trim()) {
        params.numero_cedula = filtros.numero_cedula.trim();
      }
      if (filtros.email.trim()) {
        params.email = filtros.email.trim();
      }

      const response = await apiGet<any>("/pacientes", params);
      
      let pacientesList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      // Filtrado local adicional para asegurar que solo se muestren coincidencias exactas
      pacientesList = pacientesList.filter((paciente: Paciente) => {
        const matchNombres = !filtros.nombres.trim() || 
          paciente.nombres?.toLowerCase().includes(filtros.nombres.trim().toLowerCase());
        const matchApellidos = !filtros.apellidos.trim() || 
          paciente.apellidos?.toLowerCase().includes(filtros.apellidos.trim().toLowerCase());
        const matchCelular = !filtros.numero_celular.trim() || 
          paciente.numero_celular?.includes(filtros.numero_celular.trim());
        const matchCedula = !filtros.numero_cedula.trim() || 
          paciente.numero_cedula?.includes(filtros.numero_cedula.trim());
        const matchEmail = !filtros.email.trim() || 
          paciente.email?.toLowerCase().includes(filtros.email.trim().toLowerCase());
        
        return matchNombres && matchApellidos && matchCelular && matchCedula && matchEmail;
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
      numero_celular: "",
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
              <Label htmlFor="numero_celular" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Número de Celular
              </Label>
              <Input
                id="numero_celular"
                placeholder="Ej: 0987654321"
                value={filtros.numero_celular}
                onChange={(e) => handleFilterChange("numero_celular", e.target.value)}
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
                    <TableHead>Celular</TableHead>
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
                        <TableCell>{paciente.numero_celular || "N/A"}</TableCell>
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
