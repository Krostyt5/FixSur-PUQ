import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Filter, Users } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { RequireAuth } from "@/components/require-auth";
import { AdminAccounts } from "@/components/admin-accounts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CATEGORIES,
  DAY_END,
  DAY_START,
  STATUS_LABEL,
  blockMinutes,
  categoryById,
  formatDateLabel,
  toHHMM,
  toMinutes,
  todayISO,
  type CategoryId,
  type Modality,
  type Order,
  type OrderStatus,
} from "@/lib/domain";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel central · FixSur" },
      {
        name: "description",
        content:
          "Agenda global por técnico, gestor de órdenes filtrable y reasignación manual de técnicos para el servicio técnico del hogar.",
      },
      { property: "og:title", content: "Panel central · FixSur" },
      {
        property: "og:description",
        content: "Controla la carga de trabajo de cada técnico y el estado de cada orden.",
      },
    ],
  }),
  component: AdminPanel,
});

const HOURS = Array.from(
  { length: Math.ceil((DAY_END - DAY_START) / 60) },
  (_, i) => DAY_START + i * 60,
);

function AdminPanel() {
  return (
    <RequireAuth role="admin">
      <AdminPanelInner />
      <AdminAccounts />
    </RequireAuth>
  );
}

function AdminPanelInner() {
  const { orders, technicians, setStatus, setTechnician } = useStore();
  const [date, setDate] = useState(todayISO());
  const [fCategory, setFCategory] = useState<CategoryId | "todas">("todas");
  const [fModality, setFModality] = useState<Modality | "todas">("todas");
  const [fStatus, setFStatus] = useState<OrderStatus | "todos">("todos");

  const dayOrders = orders.filter((o) => o.date === date);

  const filtered = useMemo(
    () =>
      orders
        .filter((o) => (fCategory === "todas" ? true : o.category === fCategory))
        .filter((o) => (fModality === "todas" ? true : o.modality === fModality))
        .filter((o) => (fStatus === "todos" ? true : o.status === fStatus))
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [orders, fCategory, fModality, fStatus],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">Panel central</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Agenda global, carga por técnico y gestión de órdenes.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Órdenes activas", value: orders.filter((o) => o.status !== "finalizada").length },
          { label: "Servicios de hoy", value: orders.filter((o) => o.date === todayISO()).length },
          { label: "Técnicos en terreno", value: technicians.length },
        ].map((kpi) => (
          <div key={kpi.label} className="surface-panel p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <section className="surface-panel mt-8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-4 text-primary" /> Agenda global
          </h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>
        <p className="mt-1 text-xs capitalize text-muted-foreground">{formatDateLabel(date)}</p>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="flex border-b border-border pb-2 text-xs text-muted-foreground">
              <div className="w-40 shrink-0">Técnico</div>
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center">
                  {toHHMM(h)}
                </div>
              ))}
            </div>
            {technicians.map((tech) => {
              const techOrders = dayOrders.filter((o) => o.technicianId === tech.id);
              return (
                <div key={tech.id} className="flex items-stretch border-b border-border/60 py-3">
                  <div className="flex w-40 shrink-0 items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {tech.avatarInitials}
                    </span>
                    <span className="text-xs font-medium">{tech.name}</span>
                  </div>
                  <div className="relative h-14 flex-1 rounded-lg bg-secondary/60">
                    {techOrders.map((o) => {
                      const start = toMinutes(o.start);
                      const left = ((start - DAY_START) / (DAY_END - DAY_START)) * 100;
                      const width = (blockMinutes(o.modality) / (DAY_END - DAY_START)) * 100;
                      return (
                        <div
                          key={o.id}
                          title={`${o.start} · ${o.clientName} · ${o.subServiceLabel}`}
                          className={cn(
                            "absolute top-1 flex h-12 flex-col justify-center overflow-hidden rounded-md border px-2 text-[10px] leading-tight",
                            o.modality === "presencial"
                              ? "border-primary/50 bg-primary/25"
                              : "border-success/50 bg-success/20",
                          )}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          <span className="truncate font-semibold">{o.clientName}</span>
                          <span className="truncate text-muted-foreground">
                            {o.start} · {categoryById(o.category).label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Bloques azules: visita presencial (90 min con traslado). Bloques verdes: videollamada (45 min).
        </p>
      </section>

      <section className="surface-panel mt-8 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Filter className="size-4 text-primary" /> Gestor de órdenes
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs text-muted-foreground">Tipo de servicio</Label>
            <Select value={fCategory} onValueChange={(v) => setFCategory(v as CategoryId | "todas")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Modalidad</Label>
            <Select value={fModality} onValueChange={(v) => setFModality(v as Modality | "todas")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="videollamada">Videollamada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={fStatus} onValueChange={(v) => setFStatus(v as OrderStatus | "todos")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay órdenes con esos filtros.</p>
          )}
          {filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onTechnician={(techId) => {
                setTechnician(order.id, techId);
                toast.success("Técnico reasignado");
              }}
              onStatus={(status) => {
                setStatus(order.id, status);
                toast.success(`Estado actualizado a ${STATUS_LABEL[status]}`);
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function OrderRow({
  order,
  onTechnician,
  onStatus,
}: {
  order: Order;
  onTechnician: (techId: string) => void;
  onStatus: (status: OrderStatus) => void;
}) {
  const { technicians } = useStore();
  const cat = categoryById(order.category);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {order.id} · {order.clientName}
          </p>
          <p className="text-xs text-muted-foreground">
            {cat.label} · {order.subServiceLabel}
            {order.quantity ? ` (${order.quantity} dispositivos)` : ""} · {formatDateLabel(order.date)} ·{" "}
            {order.start} hrs · {order.modality === "presencial" ? "Presencial" : "Videollamada"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Canal: {order.contactPreference === "whatsapp" ? "WhatsApp" : "Llamada"} · {order.phone}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" /> Técnico asignado
          </Label>
          <Select value={order.technicianId} onValueChange={onTechnician}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={order.status} onValueChange={(v) => onStatus(v as OrderStatus)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
