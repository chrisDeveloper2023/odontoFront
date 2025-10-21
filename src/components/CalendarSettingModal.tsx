// src/components/CalendarSettingsModal.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOdontologos } from "@/servicios/usuarios";

interface Doctor {
  id: number;
  nombres: string;
  apellidos: string;
}

interface Odontologo {
  id: number;
  nombre: string;
  color: string;
}

interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  odontologos: Odontologo[];
  onSave: (odontologos: Odontologo[]) => void;
}

const coloresDisponibles = [
  { nombre: "Rosa", valor: "bg-pink-500", hex: "#ec4899" },
  { nombre: "Amarillo", valor: "bg-yellow-500", hex: "#eab308" },
  { nombre: "Rojo", valor: "bg-red-500", hex: "#ef4444" },
  { nombre: "Azul", valor: "bg-blue-500", hex: "#3b82f6" },
  { nombre: "Verde", valor: "bg-green-500", hex: "#22c55e" },
  { nombre: "Morado", valor: "bg-purple-500", hex: "#a855f7" },
  { nombre: "Naranja", valor: "bg-orange-500", hex: "#f97316" },
  { nombre: "Cian", valor: "bg-cyan-500", hex: "#06b6d4" },
  { nombre: "ndigo", valor: "bg-indigo-500", hex: "#6366f1" },
  { nombre: "Emerald", valor: "bg-emerald-500", hex: "#10b981" },
  { nombre: "Teal", valor: "bg-teal-500", hex: "#14b8a6" },
  { nombre: "Lime", valor: "bg-lime-500", hex: "#84cc16" },
];

const CalendarSettingsModal: React.FC<CalendarSettingsModalProps> = ({
  isOpen,
  onClose,
  odontologos,
  onSave
}) => {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [odontologosEditados, setOdontologosEditados] = useState<Odontologo[]>([]);

  // Cargar doctores y sincronizar con odontlogos configurados
  useEffect(() => {
    const cargarDoctores = async () => {
      setLoadingDoctores(true);
      try {
        const doctoresData = await getOdontologos();
        setDoctores(doctoresData);
        
        // Sincronizar con los odontlogos configurados
        const odontologosSincronizados = doctoresData.map(doctor => {
          const nombreCompleto = `${doctor.nombres} ${doctor.apellidos}`;
          const odontologoExistente = odontologos.find(o => o.nombre === nombreCompleto);
          
          return {
            id: doctor.id,
            nombre: nombreCompleto,
            color: odontologoExistente?.color || "bg-blue-500"
          };
        });
        
        setOdontologosEditados(odontologosSincronizados);
      } catch (error) {
        console.error("Error cargando doctores:", error);
        setOdontologosEditados([...odontologos]);
      } finally {
        setLoadingDoctores(false);
      }
    };

    if (isOpen) {
      cargarDoctores();
    }
  }, [isOpen, odontologos]);

  const handleColorChange = (odontologoId: number, nuevoColor: string) => {
    setOdontologosEditados(prev => 
      prev.map(odontologo => 
        odontologo.id === odontologoId 
          ? { ...odontologo, color: nuevoColor }
          : odontologo
      )
    );
  };

  const handleSave = () => {
    onSave(odontologosEditados);
    onClose();
  };

  const obtenerColorActual = (odontologoId: number) => {
    const odontologo = odontologosEditados.find(o => o.id === odontologoId);
    return odontologo?.color || "bg-pink-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full bg-slate-800 border-slate-700">
        {/* Header con botn de cerrar */}
        <div className="flex items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-white">
            Configuracin
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-slate-700 p-1"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Seccin de colores */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              Color de calendarios
              <div className="flex-1 h-px bg-gray-600 ml-4"></div>
            </h3>
          </div>

          {/* Lista de odontlogos con selectores de color */}
          <div className="space-y-4">
            {loadingDoctores ? (
              <div className="text-center text-white py-4">
                Cargando mdicos...
              </div>
            ) : odontologosEditados.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                No se encontraron mdicos
              </div>
            ) : (
              odontologosEditados.map((odontologo) => (
                <div key={odontologo.id} className="flex items-center justify-between py-2">
                  <span className="text-white font-medium flex-1 pr-4">{odontologo.nombre}</span>
                  
                  <div className="flex items-center space-x-3">
                    {/* Muestra el color actual */}
                    <div 
                      className={cn(
                        "w-8 h-6 rounded border-2 border-white",
                        obtenerColorActual(odontologo.id)
                      )}
                    ></div>
                    
                    {/* Selector de colores */}
                    <div className="flex flex-wrap gap-1">
                      {coloresDisponibles.map((color) => (
                        <button
                          key={color.valor}
                          onClick={() => handleColorChange(odontologo.id, color.valor)}
                          className={cn(
                            "w-6 h-6 rounded border-2 transition-all hover:scale-110",
                            color.valor,
                            obtenerColorActual(odontologo.id) === color.valor 
                              ? "border-white ring-2 ring-white ring-offset-2 ring-offset-slate-800" 
                              : "border-gray-400 hover:border-white"
                          )}
                          title={color.nombre}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botn de guardar */}
        <div className="pt-6">
          <Button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Guardar</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarSettingsModal;
