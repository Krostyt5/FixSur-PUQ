import { categoryById, type Order } from "@/lib/domain";
import { computePrice, formatCLP, TARIFFS } from "@/lib/pricing";

export function OrderSummary({ order }: { order: Order }) {
  const qty = order.quantity ?? 1;
  const { lines, total, diagnostic } = computePrice(order.subServiceId, qty);
  const t = TARIFFS[order.subServiceId];
  const presencial = order.modality === "presencial";
  const labelled = lines.map((l, i) => {
    if (i !== 0) return l;
    const base = diagnostic
      ? "Visita y Diagnóstico en Terreno"
      : `${presencial ? "Visita presencial" : "Videollamada"} + Configuración base${t?.included && t.included > 1 ? ` (hasta ${t.included} equipos)` : ""}`;
    return { ...l, label: base };
  });
  const finalTotal = order.totalPrice ?? total;

  return (
    <div className="mt-4 rounded-lg border border-border bg-background/40 p-4 font-mono text-xs">
      <p className="border-y border-dashed border-border py-2 text-center font-semibold uppercase tracking-widest">
        Resumen de tu solicitud
      </p>
      <dl className="mt-3 space-y-1">
        <div><dt className="inline text-muted-foreground">Servicio: </dt><dd className="inline">{order.subServiceLabel} ({categoryById(order.category).label})</dd></div>
        <div><dt className="inline text-muted-foreground">Modalidad: </dt><dd className="inline">{presencial ? "Visita Presencial a Domicilio" : "Videollamada"}</dd></div>
        <div><dt className="inline text-muted-foreground">Detalle: </dt><dd className="inline">{order.detail}{order.quantity ? ` (${order.quantity} equipos en total)` : ""}</dd></div>
      </dl>
      <p className="mt-3 text-muted-foreground">Desglose de tarifa estimado:</p>
      <ul className="mt-1 space-y-1">
        {labelled.map((l) => (
          <li key={l.label} className="flex justify-between gap-3">
            <span>- {l.label}:</span>
            <span className="shrink-0">{formatCLP(l.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-y border-dashed border-border py-2 text-sm font-semibold">
        <span>TOTAL ESTIMADO:</span>
        <span className="text-accent">{formatCLP(finalTotal)}</span>
      </div>
      {diagnostic && (
        <p className="mt-2 text-muted-foreground">* El monto de diagnóstico se abona al total si aceptas la reparación.</p>
      )}
      <p className="mt-2 text-muted-foreground">* El pago se realiza al finalizar la atención con el técnico.</p>
    </div>
  );
}
