// src/components/DraftBanner.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DraftBanner({
  visible,
  onOpenDraft,
}: {
  visible: boolean;
  onOpenDraft: () => Promise<void> | void;
}) {
  if (!visible) return null;
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="py-3 flex items-center justify-between">
        <div className="text-sm text-amber-800">
          Estás viendo una versión consolidada. Para editar, abre un borrador (draft) ligado a esta cita.
        </div>
        <Button variant="default" onClick={() => void onOpenDraft()}>
          Abrir draft
        </Button>
      </CardContent>
    </Card>
  );
}
