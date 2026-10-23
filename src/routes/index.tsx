import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Clock, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryGrid, PaymentBlock } from "@/components/landing-parts";

const TITLE = "FixSur · Soporte tecnológico para el hogar en Magallanes";
const DESC =
  "Técnicos propios y certificados en Punta Arenas y Magallanes: Smart TV, celulares, impresoras, PC, notebooks y redes. Agenda visita o videollamada.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Landing,
});

const BADGES = [
  { icon: ShieldCheck, t: "Técnicos Certificados y Propios" },
  { icon: Clock, t: "Agendamiento sin Solapamiento de Horas" },
  { icon: Wallet, t: "Precios Transparentes (Pago en Línea o en Efectivo al Finalizar)" },
  { icon: MapPin, t: "Cobertura y Cercanía Local" },
];

function Landing() {
  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6">
      <section className="surface-panel hero-gradient overflow-hidden p-8 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          FixSur · Magallanes
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl">
          Tu tecnología en buenas manos, en la región más austral del país
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          En FixSur entendemos lo importante que es tener tus equipos funcionando en el hogar.
          Ayudamos a toda la familia —desde la configuración de tu Smart TV hasta el mantenimiento
          de tu computador o la red de casa— con absoluta transparencia, puntualidad y la dedicación
          que mereces. Contamos con un equipo de técnicos serios, capacitados y comprometidos con
          brindar un servicio confiable y cercano en nuestra comunidad.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link to="/agendar" search={{}}>
              <CalendarClock className="size-5" /> Agendar Visita o Asesoría
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
            <Link to="/precios">Ver Servicios y Tarifas</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BADGES.map((b) => (
          <div key={b.t} className="surface-panel flex items-center gap-3 p-4">
            <b.icon className="size-7 shrink-0 text-success" />
            <span className="font-medium">{b.t}</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">¿Qué equipo necesitas revisar?</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Elige una categoría y agenda en minutos: marca, modelo, tipo de servicio y detalle.
        </p>
        <div className="mt-6">
          <CategoryGrid />
        </div>
      </section>

      <PaymentBlock />
    </main>
  );
}
