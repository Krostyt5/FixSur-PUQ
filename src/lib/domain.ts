import {
  Tv,
  Smartphone,
  Printer,
  Monitor,
  Laptop,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type CategoryId =
  | "tv"
  | "celular"
  | "impresora"
  | "pc"
  | "notebook"
  | "casa"
  | "otros";

export type Modality = "presencial" | "videollamada";

export type OrderStatus =
  | "confirmada"
  | "en_camino"
  | "en_diagnostico"
  | "finalizada";

export type ContactPreference = "llamada" | "whatsapp";

export interface SubService {
  id: string;
  label: string;
  needsQuantity?: boolean;
  quantityLabel?: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  blurb: string;
  subServices: SubService[];
}

export const CATEGORIES: Category[] = [
  {
    id: "tv",
    label: "Smart TV",
    icon: Tv,
    blurb: "Fallas, configuración y TV Box",
    subServices: [
      { id: "tv-falla", label: "Revisión técnica por falla" },
      { id: "tv-config", label: "Configuración de Smart TV nuevo" },
      {
        id: "tv-box",
        label: "Instalación y configuración de TV Box Android / FireStick",
        needsQuantity: true,
        quantityLabel: "¿Cuántos TV Box / FireStick son?",
      },
    ],
  },
  {
    id: "celular",
    label: "Smartphones / Tablets",
    icon: Smartphone,
    blurb: "Migración de datos y apps",
    subServices: [
      { id: "cel-migracion", label: "Migración de datos a teléfono nuevo" },
      { id: "cel-apps", label: "Configuración de aplicaciones / correo" },
      { id: "cel-rendimiento", label: "Problemas de rendimiento / almacenamiento" },
    ],
  },
  {
    id: "impresora",
    label: "Impresoras",
    icon: Printer,
    blurb: "Wi-Fi, drivers y atascos",
    subServices: [
      { id: "imp-wifi", label: "Falla de conexión Wi-Fi / Red" },
      { id: "imp-drivers", label: "Instalación de drivers y configuración inicial" },
      { id: "imp-mecanica", label: "Atasco o falla mecánica" },
    ],
  },
  {
    id: "pc",
    label: "PC de Escritorio",
    icon: Monitor,
    blurb: "Formateo, limpieza y armado",
    subServices: [
      { id: "pc-formateo", label: "Formateo e instalación de S.O." },
      { id: "pc-virus", label: "Lentitud y limpieza de virus" },
      { id: "pc-armado", label: "Armado / Actualización de componentes" },
      { id: "pc-encendido", label: "Falla de encendido" },
    ],
  },
  {
    id: "notebook",
    label: "Notebook",
    icon: Laptop,
    blurb: "Formateo, limpieza y fallas",
    subServices: [
      { id: "nb-formateo", label: "Formateo e instalación de S.O." },
      { id: "nb-virus", label: "Lentitud y limpieza de virus" },
      { id: "nb-armado", label: "Actualización de componentes" },
      { id: "nb-encendido", label: "Falla de encendido" },
    ],
  },
  {
    id: "casa",
    label: "Casa Inteligente / Redes",
    icon: Wifi,
    blurb: "Alexa, Google Home y Wi-Fi",
    subServices: [
      {
        id: "casa-asistentes",
        label: "Configuración de Alexa / Google Home",
        needsQuantity: true,
        quantityLabel: "¿Cuántos dispositivos, ampolletas o enchufes son?",
      },
      { id: "casa-wifi", label: "Mejora de cobertura Wi-Fi / Mesh" },
      { id: "casa-router", label: "Configuración de router y clave de red" },
    ],
  },
  {
    id: "otros",
    label: "Otros equipos",
    icon: Wrench,
    blurb: "Cuéntanos qué necesitas",
    subServices: [{ id: "otros-general", label: "Requerimiento general a evaluar" }],
  },
];

export const SERVICE_DURATION: Record<Modality, number> = {
  videollamada: 45,
  presencial: 60,
};
export const TRAVEL_BUFFER = 30;

export function blockMinutes(modality: Modality) {
  return SERVICE_DURATION[modality] + (modality === "presencial" ? TRAVEL_BUFFER : 0);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmada: "Confirmada",
  en_camino: "Técnico en camino",
  en_diagnostico: "En diagnóstico",
  finalizada: "Finalizada",
};

export interface Technician {
  id: string;
  name: string;
  skills: CategoryId[];
  avatarInitials: string;
  userId?: string | null;
}

export interface Attachment {
  id: string;
  name: string;
  kind: "foto" | "video";
}

export interface Order {
  id: string;
  clientId?: string | null;
  clientName: string;
  phone: string;
  contactPreference: ContactPreference;
  category: CategoryId;
  subServiceId: string;
  subServiceLabel: string;
  quantity?: number;
  brand: string;
  model: string;
  detail: string;
  attachments: Attachment[];
  modality: Modality;
  date: string; // yyyy-mm-dd
  start: string; // HH:mm
  address?: string;
  technicianId: string;
  status: OrderStatus;
  report?: string;
  paymentMethod?: "web" | "transferencia" | "qr";
  totalPrice?: number;
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function orderRange(order: Order) {
  const start = toMinutes(order.start);
  return { start, end: start + blockMinutes(order.modality) };
}

export const DAY_START = toMinutes("09:00");
export const DAY_END = toMinutes("19:00");
export const SLOT_STEP = 30;

/** Técnicos sin solapamiento para un bloque dado. */
export function availableTechnicians(
  orders: Order[],
  technicians: Technician[],
  date: string,
  startMin: number,
  duration: number,
  ignoreOrderId?: string,
) {
  const end = startMin + duration;
  return technicians.filter((tech) => {
    const busy = orders.some((o) => {
      if (o.id === ignoreOrderId) return false;
      if (o.technicianId !== tech.id || o.date !== date) return false;
      if (o.status === "finalizada") return false;
      const r = orderRange(o);
      return startMin < r.end && end > r.start;
    });
    return !busy;
  });
}

export function availableSlots(
  orders: Order[],
  technicians: Technician[],
  date: string,
  modality: Modality,
) {
  const duration = blockMinutes(modality);
  const slots: { start: string; technicianId: string; freeCount: number }[] = [];
  for (let t = DAY_START; t + duration <= DAY_END; t += SLOT_STEP) {
    const free = availableTechnicians(orders, technicians, date, t, duration);
    if (free.length > 0) {
      slots.push({ start: toHHMM(t), technicianId: free[0]!.id, freeCount: free.length });
    }
  }
  return slots;
}

export function formatDateLabel(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function categoryById(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)!;
}

export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`;
}
