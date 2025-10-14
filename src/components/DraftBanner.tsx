import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DraftBanner({
  visible,
  onOpenDraft,
}: {
  visible: boolean;
  onOpenDraft?: () => Promise<void> | void;
}) {
  if (!visible) return null;
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="py-3 flex items-center justify-between gap-4">
        <div className="text-sm text-amber-800">
          Estás editando un borrador del odontograma. Recuerda consolidarlo cuando finalices los
          cambios.
        </div>
        {onOpenDraft ? (
          <Button variant="default" onClick={() => void onOpenDraft()}>
            Abrir draft
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
