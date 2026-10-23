// Tarifas en CLP (valores de ejemplo, ajustables).
export interface Tariff {
  base: number;
  /** Dispositivos incluidos en la tarifa base. */
  included?: number;
  /** Costo por cada dispositivo adicional. */
  extraUnit?: number;
  /** Tarifa corresponde a visita y diagnóstico (abonable). */
  diagnostic?: boolean;
}

export const TARIFFS: Record<string, Tariff> = {
  "tv-falla": { base: 25000, diagnostic: true },
  "tv-config": { base: 20000 },
  "tv-box": { base: 22000, included: 1, extraUnit: 10000 },
  "cel-migracion": { base: 18000 },
  "cel-apps": { base: 15000 },
  "cel-rendimiento": { base: 18000 },
  "imp-wifi": { base: 20000 },
  "imp-drivers": { base: 18000 },
  "imp-mecanica": { base: 25000, diagnostic: true },
  "pc-formateo": { base: 35000 },
  "pc-virus": { base: 30000 },
  "pc-armado": { base: 40000 },
  "pc-encendido": { base: 25000, diagnostic: true },
  "nb-formateo": { base: 35000 },
  "nb-virus": { base: 30000 },
  "nb-armado": { base: 35000 },
  "nb-encendido": { base: 25000, diagnostic: true },
  "casa-asistentes": { base: 30000, included: 3, extraUnit: 5000 },
  "casa-wifi": { base: 35000 },
  "casa-router": { base: 20000 },
  "otros-general": { base: 25000, diagnostic: true },
};

export interface PriceLine {
  label: string;
  amount: number;
}

export function computePrice(subServiceId: string, quantity: number) {
  const t = TARIFFS[subServiceId] ?? { base: 0 };
  const lines: PriceLine[] = [
    {
      label: t.diagnostic
        ? "Visita y Diagnóstico en Terreno"
        : t.included && t.included > 1
          ? `Tarifa base (incluye ${t.included} dispositivos)`
          : "Tarifa base",
      amount: t.base,
    },
  ];
  if (t.extraUnit && t.included) {
    const extra = Math.max(0, quantity - t.included);
    if (extra > 0) {
      lines.push({
        label: `${extra} dispositivo${extra > 1 ? "s" : ""} adicional${extra > 1 ? "es" : ""} × ${formatCLP(t.extraUnit)}`,
        amount: extra * t.extraUnit,
      });
    }
  }
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), diagnostic: !!t.diagnostic };
}

export function formatCLP(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}
