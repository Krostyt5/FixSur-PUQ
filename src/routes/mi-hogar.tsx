import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, MapPin, Paperclip, Phone, Video, History } from "lucide-react";

import { StatusBadge, ModalityBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  CATEGORIES,
  categoryById,
  formatDateLabel,
  todayISO,
  type Order,
} from "@/lib/domain";
import { technicianName, useStore } from "@/lib/store";
import { RequireAuth } from "@/components/require-auth";
import { CalendarButtons } from "@/components/calendar-buttons";
import { OrderSummary } from "@/components/order-summary";

export const Route = createFileRoute("/mi-hogar")({
  head: () => ({
    meta: [
      { title: "Mi hogar · FixSur" },
      {
        name: "description",
        content:
          "Revisa tus solicitudes activas, el estado de cada atención y la ficha histórica de los equipos de tu hogar.",
      },
      { property: "og:title", content: "Mi hogar · FixSur" },
      {
        property: "og:description",
        content: "Solicita soporte técnico para tus equipos y sigue el estado de tus órdenes.",
      },
    ],
  }),
  component: ClientDashboard,
});

function ClientDashboard() {
  return (
    <RequireAuth>
      <ClientDashboardInner />
    </RequireAuth>
  );
}

function ClientDashboardInner() {
  const { orders, user, profile } = useStore();
  const mine = orders.filter((o) => o.clientId === user?.id);
  const active = mine.filter((o) => o.status !== "finalizada");
  const history = mine.filter((o) => o.status === "finalizada");

  const devices = Object.values(
    mine.reduce<Record<string, { key: string; brand: string; model: string; category: Order["category"]; visits: Order[] }>>(
      (acc, o) => {
        const key = `${o.category}-${o.brand}-${o.model}`;
        acc[key] ??= { key, brand: o.brand, model: o.model, category: o.category, visits: [] };
        acc[key].visits.push(o);
        return acc;
      },
      {},
    ),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="surface-panel hero-gradient overflow-hidden p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Hola{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </p>
        <h1 className="mt-2 max-w-2xl text-2xl font-semibold sm:text-3xl">
          Soporte técnico para tu casa, presencial o por videollamada
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Elige el equipo con problemas, cuéntanos el detalle y agenda en un horario con técnico
          disponible confirmado.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/agendar" search={{}}>
            <CalendarClock className="size-4" /> Solicitar nuevo servicio
          </Link>
        </Button>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">¿Qué equipo necesita atención?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to="/agendar"
              search={{ categoria: cat.id }}
              className="group surface-panel flex items-start gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <cat.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{cat.label}</span>
                <span className="block text-xs text-muted-foreground">{cat.blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Solicitudes activas</h2>
          <div className="mt-4 space-y-3">
            {active.length === 0 && (
              <p className="surface-panel p-6 text-sm text-muted-foreground">
                No tienes solicitudes activas. Agenda una nueva atención cuando lo necesites.
              </p>
            )}
            {active.map((order) => {
              const cat = categoryById(order.category);
              return (
                <article key={order.id} className="surface-panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <cat.icon className="size-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">
                          {order.subServiceLabel}
                          {order.quantity ? ` · ${order.quantity} dispositivos` : ""}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {cat.label} · {order.brand} {order.model} · Orden {order.id}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <OrderSummary order={order} />
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <ModalityBadge modality={order.modality} />
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      {formatDateLabel(order.date)} · {order.start} hrs
                      {order.date === todayISO() ? " (hoy)" : ""}
                    </span>
                    {order.address && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" /> {order.address}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      {order.contactPreference === "whatsapp" ? (
                        <>WhatsApp</>
                      ) : (
                        <>
                          <Phone className="size-3.5" /> Llamada
                        </>
                      )}
                    </span>
                    {order.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="size-3.5" /> {order.attachments.length} adjunto(s)
                      </span>
                    )}
                    {order.modality === "videollamada" && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Video className="size-3.5" /> Enlace enviado por{" "}
                        {order.contactPreference === "whatsapp" ? "WhatsApp" : "SMS"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Técnico asignado: <span className="text-foreground">{technicianName(order.technicianId)}</span>
                  </p>
                  <div className="mt-3">
                    <CalendarButtons order={order} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Equipos de mi hogar</h2>
          <div className="mt-4 space-y-3">
            {devices.map((device) => {
              const cat = categoryById(device.category);
              return (
                <article key={device.key} className="surface-panel p-4">
                  <div className="flex items-center gap-2">
                    <cat.icon className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      {device.brand} {device.model}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{cat.label}</p>
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {device.visits.map((visit) => (
                      <li key={visit.id} className="text-xs text-muted-foreground">
                        <span className="text-foreground">{formatDateLabel(visit.date)}</span> ·{" "}
                        {visit.subServiceLabel}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <h2 className="mt-8 flex items-center gap-2 text-lg font-semibold">
            <History className="size-4 text-success" /> Atenciones finalizadas
          </h2>
          <div className="mt-4 space-y-3">
            {history.length === 0 && (
              <p className="surface-panel p-4 text-sm text-muted-foreground">
                Aún no tienes atenciones cerradas.
              </p>
            )}
            {history.map((order) => (
              <article key={order.id} className="surface-panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{order.subServiceLabel}</h3>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateLabel(order.date)} · {technicianName(order.technicianId)}
                </p>
                {order.report && (
                  <p className="mt-2 rounded-lg bg-secondary p-3 text-xs text-secondary-foreground">
                    <span className="font-semibold">Informe técnico: </span>
                    {order.report}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
