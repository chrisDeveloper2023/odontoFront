import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, Clock3, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  fetchHistoriasPorPaciente,
  abrirHistoriaDesdeCita,
  cerrarHistoria,
} from "@/lib/api/historiasClinicas";
import {
  abrirDraftOdontograma,
  consolidarOdontograma,
  descartarOdontograma,
  getOdontogramaByHistoria,
  OdontogramaResponse,
  withDraftRetry,
} from "@/lib/api/odontograma";

type CitaTimelineProps = {
  citaId: number;
  pacienteId: number;
  onOpenHistoria?: (historiaId: number) => void;
};

const historiaQueryKey = (citaId: number, pacienteId: number) => ["historia-by-cita", citaId, pacienteId];

export function CitaTimeline({ citaId, pacienteId, onOpenHistoria }: CitaTimelineProps) {
  const queryClient = useQueryClient();
  const [historiaAction, setHistoriaAction] = useState<"open" | "close" | null>(null);
  const [odoAction, setOdoAction] = useState<"open-draft" | "publish" | "discard" | null>(null);

  const historiaQuery = useQuery({
    queryKey: historiaQueryKey(citaId, pacienteId),
    enabled: Boolean(citaId && pacienteId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!pacienteId) return [];
      return fetchHistoriasPorPaciente(pacienteId);
    },
  });

  const historiaList = historiaQuery.data ?? [];
  const historia = historiaList.find((hist) => hist.id_cita === citaId) ?? null;
  const historiaId = historia?.id_historia ?? null;
  const historiaCerrada = historia?.estado === "CERRADA" || Boolean(historia?.fecha_cierre);
  const historiaEditBlockedMessage = "La historia esta cerrada y no admite nuevas ediciones.";

  const odontogramaQuery = useQuery({
    queryKey: ["odontograma", historiaId],
    enabled: Boolean(historiaId),
    queryFn: async (): Promise<OdontogramaResponse | null> => {
      if (!historiaId) return null;
      return getOdontogramaByHistoria(historiaId, { vigente: false });
    },
  });

  const odontogramaData = odontogramaQuery.data ?? null;
  const ogDraft = odontogramaData?.odontograma && odontogramaData.odontograma.is_draft
    ? odontogramaData.odontograma
    : null;
  const hasDraft = Boolean(ogDraft);
  const versionToken = ogDraft?.version_token ?? null;

  const invalidateHistoria = () => {
    queryClient.invalidateQueries({ queryKey: historiaQueryKey(citaId, pacienteId) });
    queryClient.invalidateQueries({ queryKey: ["cita", citaId] });
  };

  const invalidateOdontograma = () => {
    if (historiaId) {
      queryClient.invalidateQueries({ queryKey: ["odontograma", historiaId] });
    }
  };

  const handleAbrirHistoria = async () => {
    if (!citaId) return;
    try {
      setHistoriaAction("open");
      const historiaCreada = await abrirHistoriaDesdeCita(citaId);
      toast.success("Historia abierta para la cita");
      invalidateHistoria();
      if (historiaCreada?.id_historia && onOpenHistoria) {
        onOpenHistoria(historiaCreada.id_historia);
      }
    } catch (error: any) {
      const message =
        error?.status === 403
          ? "No tienes permisos para abrir esta historia"
          : error?.message || "No se pudo abrir la historia";
      toast.error(message);
    } finally {
      setHistoriaAction(null);
    }
  };

  const handleCerrarHistoria = async () => {
    if (!historiaId) return;
    let motivoValue: string | undefined;
    if (typeof window !== "undefined") {
      const promptValue = window.prompt(
        "Motivo de cierre (opcional)",
        historia?.motivo_cierre ?? "Atencion completada",
      );
      if (promptValue === null) {
        return;
      }
      motivoValue = promptValue.trim() || undefined;
    } else {
      motivoValue = historia?.motivo_cierre ?? undefined;
    }
    try {
      setHistoriaAction("close");
      await cerrarHistoria(historiaId, motivoValue);
      toast.success("Historia cerrada");
      invalidateHistoria();
      invalidateOdontograma();
    } catch (error: any) {
      const message =
        error?.status === 403
          ? "No tienes permisos para cerrar la historia"
          : error?.status === 409
            ? "La historia ya esta cerrada"
            : error?.message || "No se pudo cerrar la historia";
      toast.error(message);
    } finally {
      setHistoriaAction(null);
    }
  };

  const handleOpenOdontoDraft = async () => {
    if (!historiaId) return;
    if (historiaCerrada) {
      toast.error(historiaEditBlockedMessage);
      return;
    }
    try {
      setOdoAction("open-draft");
      await abrirDraftOdontograma(historiaId, "from_last");
      toast.success("Borrador de odontograma listo");
      invalidateOdontograma();
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      if (status === 409) {
        toast.error(historiaEditBlockedMessage);
      } else {
        toast.error(error?.message || "No se pudo abrir el odontograma");
      }
    } finally {
      setOdoAction(null);
    }
  };

  const handlePublishDraft = async () => {
    if (!ogDraft) return;
    if (historiaCerrada) {
      toast.error(historiaEditBlockedMessage);
      return;
    }
    try {
      setOdoAction("publish");
      await withDraftRetry(
        () => consolidarOdontograma(ogDraft.id_odontograma, { versionToken }),
        async () => {
          if (historiaId) {
            await abrirDraftOdontograma(historiaId, "from_last");
          }
        },
      );
      toast.success("Odontograma publicado");
      invalidateOdontograma();
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      if (status === 409) {
        toast.error(historiaEditBlockedMessage);
      } else {
        toast.error(error?.message || "No se pudo publicar el odontograma");
      }
    } finally {
      setOdoAction(null);
    }
  };

  const handleDiscardDraft = async () => {
    if (!ogDraft) return;
    if (historiaCerrada) {
      toast.error(historiaEditBlockedMessage);
      return;
    }
    try {
      setOdoAction("discard");
      await withDraftRetry(
        () => descartarOdontograma(ogDraft.id_odontograma, { versionToken }),
        async () => {
          if (historiaId) {
            await abrirDraftOdontograma(historiaId, "from_last");
          }
        },
      );
      toast.success("Borrador descartado");
      invalidateOdontograma();
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      if (status === 409) {
        toast.error(historiaEditBlockedMessage);
      } else {
        toast.error(error?.message || "No se pudo descartar el borrador");
      }
    } finally {
      setOdoAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <StepCard
        icon={<FileText className="h-5 w-5 text-blue-600" />}
        title="Historia clinica"
        loading={historiaQuery.isLoading && !historia}
        badge={
          historia
            ? (
              <Badge className={historiaCerrada ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}>
                {historiaCerrada ? "CERRADA" : "ABIERTA"}
              </Badge>
            )
            : <Badge variant="outline">Pendiente</Badge>
        }
        content={
          <div className="flex flex-col gap-3 text-sm">
            {historia ? (
              <>
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    ID historia: {historia.id_historia} {historia.fecha_creacion && `· ${new Date(historia.fecha_creacion).toLocaleString()}`}
                  </p>
                  {historiaCerrada && historia.fecha_cierre && (
                    <p className="text-xs text-emerald-700">
                      Cerrada el {new Date(historia.fecha_cierre).toLocaleString()}
                    </p>
                  )}
                  {historiaCerrada && historia.cerrada_por && (
                    <p className="text-xs text-muted-foreground">
                      Por usuario #{historia.cerrada_por}
                    </p>
                  )}
                  {historiaCerrada && historia.motivo_cierre && (
                    <p className="text-xs text-muted-foreground">
                      Motivo: {historia.motivo_cierre}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!historiaCerrada && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={historiaAction === "close"}
                      onClick={handleCerrarHistoria}
                    >
                      {historiaAction === "close" ? "Cerrando..." : "Cerrar historia"}
                    </Button>
                  )}
                  {historiaId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenHistoria?.(historiaId)}
                    >
                      Ver historia
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-muted-foreground">Aun no hay historia vinculada a esta cita.</p>
                <Button
                  size="sm"
                  onClick={handleAbrirHistoria}
                  disabled={historiaAction === "open"}
                >
                  {historiaAction === "open" ? "Creando..." : "Abrir historia"}
                </Button>
              </div>
            )}
          </div>
        }
      />

      <StepCard
        icon={<Activity className="h-5 w-5 text-orange-500" />}
        title="Odontograma"
        loading={historiaId != null && historia && odontogramaQuery.isLoading && !odontogramaData}
        badge={
          historiaCerrada
            ? <Badge className="bg-slate-100 text-slate-700">SOLO LECTURA</Badge>
            : hasDraft
              ? <Badge className="bg-amber-100 text-amber-800">BORRADOR</Badge>
              : <Badge variant="outline">{historia ? "Sin borrador" : "Historia requerida"}</Badge>
        }
        content={
          <div className="flex flex-col gap-3 text-sm">
            {!historia && (
              <p className="text-muted-foreground">
                Necesitas una historia abierta para trabajar el odontograma.
              </p>
            )}
            {historia && (
              <>
                <div className="text-muted-foreground">
                  {ogDraft ? (
                    <>
                      <p>Ultimo borrador: {new Date(ogDraft.fecha_modificacion ?? ogDraft.fecha_creacion).toLocaleString()}</p>
                      <p className="text-xs">
                        Version #{ogDraft.version} {versionToken ? `· token ${versionToken.slice(0, 8)}…` : ""}
                      </p>
                    </>
                  ) : (
                    <p>No hay borradores activos.</p>
                  )}
                </div>
                {historiaCerrada ? (
                  <p className="text-xs text-muted-foreground">
                    Historia cerrada: el odontograma se muestra en solo lectura y no admite nuevos borradores.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleOpenOdontoDraft}
                      disabled={!historiaId || odoAction === "open-draft"}
                    >
                      {odoAction === "open-draft" ? "Preparando..." : "Abrir borrador"}
                    </Button>
                    {hasDraft && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handlePublishDraft}
                          disabled={odoAction === "publish"}
                        >
                          {odoAction === "publish" ? "Publicando..." : "Publicar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDiscardDraft}
                          disabled={odoAction === "discard"}
                        >
                          {odoAction === "discard" ? "Descartando..." : "Descartar"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        }
      />

      <StepCard
        icon={<Clock3 className="h-5 w-5 text-gray-500" />}
        title="Plan de tratamiento"
        badge={<Badge variant="outline">Sprint B</Badge>}
        content={
          <p className="text-sm text-muted-foreground">
            En el siguiente sprint podremos crear y aprobar planes directamente desde la linea de tiempo.
          </p>
        }
      />

      <StepCard
        icon={<Clock3 className="h-5 w-5 text-gray-500" />}
        title="Facturacion y pagos"
        badge={<Badge variant="outline">Sprint B</Badge>}
        content={
          <p className="text-sm text-muted-foreground">
            Aqui veras el estado de facturas y pagos ligados a la cita cuando el modulo este disponible.
          </p>
        }
      />

      <StepCard
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        title="Cerrar atencion"
        badge={
          historiaCerrada
            ? <Badge className="bg-emerald-100 text-emerald-800">CERRADA</Badge>
            : <Badge variant="outline">Pendiente</Badge>
        }
        content={
          <div className="flex flex-col gap-3 text-sm">
            {historiaCerrada ? (
              <>
                <p className="text-emerald-700">
                  Atencion cerrada. No se permiten nuevas ediciones sobre la historia ni el odontograma.
                </p>
                {historia?.fecha_cierre && (
                  <p className="text-xs text-muted-foreground">
                    Fecha: {new Date(historia.fecha_cierre).toLocaleString()}
                  </p>
                )}
                {historia?.cerrada_por && (
                  <p className="text-xs text-muted-foreground">
                    Usuario: #{historia.cerrada_por}
                  </p>
                )}
                {historia?.motivo_cierre && (
                  <p className="text-xs text-muted-foreground">
                    Motivo: {historia.motivo_cierre}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Cierra la atencion cuando toda la documentacion clinica este completa.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCerrarHistoria}
                  disabled={!historiaId || historiaAction === "close"}
                >
                  {historiaAction === "close" ? "Cerrando..." : "Cerrar atencion"}
                </Button>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}

type StepCardProps = {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  loading?: boolean;
  content: React.ReactNode;
};

function StepCard({ icon, title, badge, loading, content }: StepCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2">{icon}</div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        {badge}
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-16" /> : content}</CardContent>
    </Card>
  );
}

export default CitaTimeline;
