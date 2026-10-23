import { Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { CATEGORIES } from "@/lib/domain";

export function CategoryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((c) => (
        <Link
          key={c.id}
          to="/agendar"
          search={{ categoria: c.id }}
          className="surface-panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <c.icon className="size-6" />
          </span>
          <span className="font-display text-lg font-semibold">{c.label}</span>
          <span className="text-base text-muted-foreground">{c.blurb}</span>
          <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
            Agendar <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function PaymentBlock() {
  return (
    <section className="surface-panel p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-7 text-success" />
        <h2 className="font-display text-2xl font-semibold">Pago seguro y flexible</h2>
      </div>
      <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
        Aceptamos pagos con Tarjeta de Débito/Crédito en línea y también Pago Presencial en
        Efectivo o Transferencia al finalizar el trabajo con el técnico (ideal para adultos
        mayores o quienes prefieren pagar al ver el servicio terminado).
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: CreditCard, t: "Tarjeta en línea", d: "Débito o crédito" },
          { icon: Banknote, t: "Efectivo o transferencia", d: "Al finalizar la atención" },
          { icon: QrCode, t: "Código QR", d: "Desde la app de tu banco" },
        ].map((p) => (
          <div key={p.t} className="flex items-center gap-3 rounded-xl border border-border p-4">
            <p.icon className="size-6 text-primary" />
            <div>
              <p className="font-semibold">{p.t}</p>
              <p className="text-sm text-muted-foreground">{p.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
