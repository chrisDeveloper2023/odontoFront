import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import OdontogramaView from "@/components/OdontogramaView";
import type { OdontogramaResponse } from "@/lib/api/odontograma";

type OdontogramaViewMode = "tablero" | "fauces";

interface OdontogramaModalProps {
  open: boolean;
  onClose: () => void;
  data: OdontogramaResponse | null;
  loading?: boolean;
  error?: string | null;
  historiaId?: number | null;
  ensureDraft?: () => Promise<void>;
  onReload?: () => void;
  onRefreshRequest?: () => void;
}

export default function OdontogramaModal({
  open,
  onClose,
  data,
  loading = false,
  error,
  historiaId,
  ensureDraft,
  onReload,
  onRefreshRequest,
}: OdontogramaModalProps) {
  const [view, setView] = useState<OdontogramaViewMode>("tablero");

  useEffect(() => {
    if (open) {
      setView("tablero");
    }
  }, [open]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-col gap-3 border-b pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <DialogTitle className="text-lg font-semibold">
              Odontograma {historiaId ? `· Historia #${historiaId}` : ""}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={view === "tablero" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("tablero")}
              >
                Vista tablero
              </Button>
              <Button
                variant={view === "fauces" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("fauces")}
              >
                Vista fauces
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Recargar odontograma"
                disabled={loading}
                onClick={() => onRefreshRequest?.()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {loading && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando odontograma...
            </div>
          )}

          {!loading && data && (
            <div className="py-4">
              <OdontogramaView
                data={data}
                ensureDraft={ensureDraft}
                onReload={onReload}
                mode={view}
              />
            </div>
          )}

          {!loading && !data && !error && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Selecciona una historia clínica para cargar el odontograma.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

