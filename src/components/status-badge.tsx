import { STATUS_LABEL, type OrderStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<OrderStatus, string> = {
  confirmada: "bg-primary/15 text-primary border-primary/30",
  en_camino: "bg-warning/15 text-warning border-warning/30",
  en_diagnostico: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  finalizada: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ModalityBadge({ modality }: { modality: "presencial" | "videollamada" }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {modality === "presencial" ? "Visita presencial · 90 min" : "Videollamada · 45 min"}
    </span>
  );
}
