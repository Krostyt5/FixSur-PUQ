import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Paperclip,
  Phone,
  Video,
  Home,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computePrice, formatCLP } from "@/lib/pricing";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payment";
import { PaymentInfo } from "@/components/payment-info";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CATEGORIES,
  addDaysISO,
  availableSlots,
  blockMinutes,
  categoryById,
  formatDateLabel,
  todayISO,
  type Attachment,
  type CategoryId,
  type ContactPreference,
  type Modality,
  type Order,
} from "@/lib/domain";
import { technicianName, useStore } from "@/lib/store";
import { RequireAuth } from "@/components/require-auth";
import { CalendarButtons } from "@/components/calendar-buttons";
import { cn } from "@/lib/utils";
import { OTHER_BRAND, OTHER_MODEL, brandsFor, modelsFor } from "@/lib/brands";
import { SearchableSelect } from "@/components/searchable-select";

export const Route = createFileRoute("/agendar")({
  validateSearch: (search: Record<string, unknown>): { categoria?: CategoryId } => {
    const raw = search["categoria"];
    return typeof raw === "string" ? { categoria: raw as CategoryId } : {};
  },
  head: () => ({
    meta: [
      { title: "Agendar servicio técnico · FixSur" },
      {
        name: "description",
        content:
          "Wizard de agendamiento: elige equipo y tipo de servicio, describe la falla, adjunta fotos y reserva un horario con técnico disponible.",
      },
      { property: "og:title", content: "Agendar servicio técnico · FixSur" },
      {
        property: "og:description",
        content: "Reserva una visita presencial o una asesoría por videollamada en minutos.",
      },
    ],
  }),
  component: Wizard,
});

const STEPS = ["Equipo y servicio", "Detalle y adjuntos", "Modalidad", "Fecha y contacto", "Confirmación"];

const DATES = Array.from({ length: 10 }, (_, i) => addDaysISO(i));

function Wizard() {
  return (
    <RequireAuth>
      <WizardInner />
    </RequireAuth>
  );
}

function WizardInner() {
  const { categoria } = Route.useSearch();
  const navigate = useNavigate();
  const { busy, technicians, addOrder, profile, saveProfile } = useStore();
  const [done, setDone] = useState<Order>();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategoryId | undefined>(categoria);
  const [subServiceId, setSubServiceId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [brandChoice, setBrandChoice] = useState("");
  const [modelChoice, setModelChoice] = useState("");
  const [detail, setDetail] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [modality, setModality] = useState<Modality>();
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState<{ start: string; technicianId: string }>();
  const [address, setAddress] = useState("");
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [contactPreference, setContactPreference] = useState<ContactPreference>("whatsapp");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transferencia");

  const cat = category ? categoryById(category) : undefined;
  const sub = cat?.subServices.find((s) => s.id === subServiceId);

  const slots = useMemo(
    () => (modality ? availableSlots(busy, technicians, date, modality) : []),
    [busy, technicians, date, modality],
  );

  const canContinue = [
    Boolean(category && subServiceId && brand.trim() && (model.trim() || modelChoice === OTHER_MODEL)),
    detail.trim().length >= 10,
    Boolean(modality),
    Boolean(slot && name.trim() && phone.trim() && (modality === "videollamada" || address.trim())),
    true,
  ][step];

  function next() {
    if (!canContinue) {
      toast.error("Completa los campos requeridos para continuar.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function confirm() {
    if (!category || !sub || !modality || !slot) return;
    const order: Order = {
      id: `ORD-${Math.floor(2000 + Math.random() * 7999)}`,
      clientName: name.trim(),
      phone: phone.trim(),
      contactPreference,
      category,
      subServiceId: sub.id,
      subServiceLabel: sub.label,
      brand: brand.trim(),
      model: model.trim() || "Modelo no especificado",
      detail: detail.trim(),
      attachments,
      modality,
      date,
      start: slot.start,
      technicianId: slot.technicianId,
      status: "confirmada",
      paymentMethod,
      totalPrice: computePrice(sub.id, sub.needsQuantity ? quantity : 1).total,
      ...(sub.needsQuantity ? { quantity } : {}),
      ...(modality === "presencial" ? { address: address.trim() } : {}),
    };
    const ok = await addOrder(order);
    if (!ok) {
      setSlot(undefined);
      setStep(3);
      return;
    }
    if (profile && (profile.phone !== order.phone || profile.full_name !== order.clientName)) {
      void saveProfile({ full_name: order.clientName, phone: order.phone });
    }
    toast.success(`Orden ${order.id} confirmada con ${technicianName(order.technicianId)}`);
    setDone(order);
  }

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <section className="surface-panel p-6 text-center">
          <Check className="mx-auto size-10 text-success" />
          <h1 className="mt-3 text-xl font-semibold">¡Servicio agendado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Orden {done.id} · {formatDateLabel(done.date)} a las {done.start} hrs con{" "}
            {technicianName(done.technicianId)}.
          </p>
          {done.paymentMethod && done.totalPrice != null && (
            <div className="mt-5 rounded-xl border border-border p-4 text-left">
              <h2 className="mb-3 text-sm font-semibold">
                Pago · {PAYMENT_METHODS.find((m) => m.id === done.paymentMethod)?.label}
              </h2>
              <PaymentInfo method={done.paymentMethod} orderId={done.id} total={done.totalPrice} />
            </div>
          )}
          <p className="mt-4 text-sm">Agrégalo a tu calendario para recibir el recordatorio:</p>
          <div className="mt-3 flex justify-center">
            <CalendarButtons order={done} />
          </div>
          <Button className="mt-6" onClick={() => navigate({ to: "/mi-hogar" })}>
            Ir a Mi hogar
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">Agendar atención técnica</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cinco pasos y queda reservado con un técnico disponible.
      </p>

      <ol className="mt-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
              i === step
                ? "border-primary/50 bg-primary/15 text-primary"
                : i < step
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {i < step ? <Check className="size-3.5" /> : <span>{i + 1}</span>}
            {label}
          </li>
        ))}
      </ol>

      <section className="surface-panel mt-6 p-5 sm:p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold">1. ¿Qué equipo necesita atención?</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategory(c.id);
                      setSubServiceId(undefined);
                      setBrandChoice("");
                      setModelChoice("");
                      setBrand("");
                      setModel("");
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                      category === c.id
                        ? "border-primary bg-primary/10 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <c.icon className="size-5 text-primary" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {cat && (
              <div key={cat.id} className="animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="text-sm font-semibold">Tipo específico de servicio</h3>
                <RadioGroup
                  value={subServiceId ?? ""}
                  onValueChange={setSubServiceId}
                  className="mt-3 space-y-2"
                >
                  {cat.subServices.map((s) => (
                    <label
                      key={s.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                        subServiceId === s.id ? "border-primary bg-primary/10" : "border-border",
                      )}
                    >
                      <RadioGroupItem value={s.id} className="mt-0.5" />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </RadioGroup>

                {sub?.needsQuantity && (
                  <div className="mt-4 max-w-xs">
                    <Label htmlFor="cantidad">{sub.quantityLabel}</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min={1}
                      max={30}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="marca">Marca del equipo *</Label>
                    {category === "otros" ? (
                      <Input
                        id="marca"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Escribe la marca"
                        className="mt-2"
                      />
                    ) : (
                      <>
                        <SearchableSelect
                          id="marca"
                          options={brandsFor(category!)}
                          value={brandChoice}
                          onChange={(v) => {
                            setBrandChoice(v);
                            setBrand(v === OTHER_BRAND ? "" : v);
                            setModelChoice("");
                            setModel("");
                          }}
                          placeholder="Selecciona la marca"
                          searchPlaceholder="Buscar marca..."
                        />
                        {brandChoice === OTHER_BRAND && (
                          <Input
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="Escribe la marca"
                            className="mt-2 animate-in fade-in slide-in-from-top-1"
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="modelo">Modelo *</Label>
                    {category === "otros" || brandChoice === OTHER_BRAND ? (
                      <Input
                        id="modelo"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Escribe el modelo (o 'No lo sé')"
                        className="mt-2"
                      />
                    ) : (
                      <>
                        <SearchableSelect
                          id="modelo"
                          options={brandChoice ? modelsFor(category!, brandChoice) : []}
                          value={modelChoice}
                          onChange={(v) => {
                            setModelChoice(v);
                            setModel(v === OTHER_MODEL ? "" : v);
                          }}
                          placeholder={brandChoice ? "Selecciona el modelo" : "Primero elige la marca"}
                          searchPlaceholder="Buscar modelo..."
                        />
                        {modelChoice === OTHER_MODEL && (
                          <Input
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="Escribe el modelo si lo conoces"
                            className="mt-2 animate-in fade-in slide-in-from-top-1"
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold">2. Detalle del problema</h2>
            <div>
              <Label htmlFor="detalle">
                Comentario / detalle adicional de lo que sucede o lo que necesitas *
              </Label>
              <Textarea
                id="detalle"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={6}
                placeholder="Cuéntanos qué pasa, desde cuándo, qué has intentado y qué esperas lograr."
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo 10 caracteres. Mientras más detalle, mejor llega preparado el técnico.
              </p>
            </div>
            <div>
              <Label htmlFor="adjuntos" className="flex items-center gap-2">
                <Paperclip className="size-4" /> Adjuntar fotos o videos de la falla o conexiones
              </Label>
              <Input
                id="adjuntos"
                type="file"
                multiple
                accept="image/*,video/*"
                className="mt-2"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setAttachments(
                    files.map((f, i) => ({
                      id: `${Date.now()}-${i}`,
                      name: f.name,
                      kind: f.type.startsWith("video") ? "video" : "foto",
                    })),
                  );
                }}
              />
              {attachments.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-full border border-border bg-secondary px-3 py-1 text-xs"
                    >
                      {a.kind === "video" ? "🎬" : "🖼️"} {a.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold">3. ¿Cómo prefieres la atención?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "presencial" as Modality,
                    icon: Home,
                    title: "Visita presencial en domicilio",
                    desc: "60 minutos de servicio + 30 minutos de margen de traslado.",
                  },
                  {
                    id: "videollamada" as Modality,
                    icon: Video,
                    title: "Asesoría virtual por videollamada",
                    desc: "45 minutos guiados por el técnico, sin esperas de traslado.",
                  },
                ]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setModality(opt.id);
                    setSlot(undefined);
                  }}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    modality === opt.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <opt.icon className="size-5 text-primary" />
                  <h3 className="mt-3 text-sm font-semibold">{opt.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && modality && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold">4. Fecha, hora y datos de contacto</h2>

            <div>
              <Label>Elige el día</Label>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                {DATES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDate(d);
                      setSlot(undefined);
                    }}
                    className={cn(
                      "min-w-24 rounded-lg border px-3 py-2 text-xs capitalize transition-colors",
                      date === d ? "border-primary bg-primary/10 text-primary" : "border-border",
                    )}
                  >
                    {formatDateLabel(d)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Clock className="size-4" /> Horarios libres ({blockMinutes(modality)} min de bloque)
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No quedan bloques disponibles este día. Prueba con otra fecha.
                  </p>
                )}
                {slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => setSlot({ start: s.start, technicianId: s.technicianId })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      slot?.start === s.start
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    {s.start}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.freeCount} técnico(s)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {modality === "presencial" && (
              <div>
                <Label htmlFor="direccion" className="flex items-center gap-2">
                  <MapPin className="size-4" /> Dirección exacta de la visita *
                </Label>
                <Input
                  id="direccion"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, depto/casa, comuna"
                  className="mt-2"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input id="nombre" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="fono">Teléfono de contacto *</Label>
                <Input id="fono" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2" />
              </div>
            </div>

            <div>
              <Label>Preferencia de contacto</Label>
              <RadioGroup
                value={contactPreference}
                onValueChange={(v) => setContactPreference(v as ContactPreference)}
                className="mt-2 grid gap-2 sm:grid-cols-2"
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm",
                    contactPreference === "llamada" ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <RadioGroupItem value="llamada" />
                  <Phone className="size-4 text-primary" /> Llamada telefónica directa
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm",
                    contactPreference === "whatsapp"
                      ? "border-whatsapp bg-whatsapp/10"
                      : "border-border",
                  )}
                >
                  <RadioGroupItem value="whatsapp" />
                  <MessageCircle className="size-4 text-whatsapp" /> Mensaje de WhatsApp
                </label>
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold">5. Confirma tu requerimiento</h2>
            <dl className="divide-y divide-border rounded-xl border border-border">
              {[
                ["Equipo", `${cat?.label} · ${brand} ${model}`],
                [
                  "Servicio",
                  `${sub?.label}${sub?.needsQuantity ? ` · ${quantity} dispositivos` : ""}`,
                ],
                ["Detalle", detail],
                [
                  "Adjuntos",
                  attachments.length ? attachments.map((a) => a.name).join(", ") : "Sin adjuntos",
                ],
                [
                  "Modalidad",
                  modality === "presencial"
                    ? "Visita presencial (60 min + 30 min de traslado)"
                    : "Videollamada (45 min)",
                ],
                ["Fecha y hora", `${formatDateLabel(date)} · ${slot?.start} hrs`],
                ...(modality === "presencial" ? [["Dirección", address]] : []),
                ["Contacto", `${name} · ${phone}`],
                [
                  "Canal preferido",
                  contactPreference === "whatsapp" ? "Mensaje de WhatsApp" : "Llamada telefónica",
                ],
                ["Técnico asignado", slot ? technicianName(slot.technicianId) : "—"],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 p-3 sm:grid-cols-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-sm sm:col-span-2">{value}</dd>
                </div>
              ))}
            </dl>
            {sub && (() => {
              const price = computePrice(sub.id, sub.needsQuantity ? quantity : 1);
              return (
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                  <h3 className="mb-3 text-sm font-semibold">Desglose de precio</h3>
                  <ul className="space-y-2 text-sm">
                    {price.lines.map((l) => (
                      <li key={l.label} className="flex justify-between gap-3">
                        <span className="text-muted-foreground">{l.label}</span>
                        <span className="font-medium tabular-nums">{formatCLP(l.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold">
                    <span>Total estimado</span>
                    <span className="tabular-nums text-primary">{formatCLP(price.total)}</span>
                  </div>
                  {price.diagnostic && (
                    <p className="mt-3 rounded-lg bg-accent/40 p-3 text-xs text-foreground">
                      Este precio corresponde a la <strong>Visita y Diagnóstico en Terreno</strong>. Si aceptas
                      la reparación, este monto se abona al costo total.
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Valores en pesos chilenos, IVA incluido. Referencia de mercado en Chile: visita técnica a
                    domicilio entre $15.000 y $30.000.
                  </p>
                  <h3 className="mb-2 mt-5 text-sm font-semibold">Forma de pago</h3>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition",
                          paymentMethod === m.id
                            ? "border-primary bg-primary/15"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <span className="block text-sm font-semibold">{m.label}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{m.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" /> Atrás
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Continuar <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={confirm}>
              <Check className="size-4" /> Confirmar requerimiento
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
