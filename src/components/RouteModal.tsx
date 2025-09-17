// src/components/RouteModal.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function RouteModal({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => setOpen(true), []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) navigate(-1); setOpen(v); }}>
      <DialogContent className="w-[96vw] sm:max-w-[960px] md:max-w-[1100px] max-h-[90vh] p-0 overflow-hidden">
        {title && (
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="overflow-y-auto max-h-[calc(90vh-56px)] px-6 py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
