import { SERVICE_DURATION, type Order } from "./domain";

function stamp(date: string, hhmm: string, addMin = 0) {
  const d = new Date(`${date}T${hhmm}:00`);
  d.setMinutes(d.getMinutes() + addMin);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function info(order: Order, techName: string) {
  const title = `FixSur · ${order.subServiceLabel}${order.quantity ? ` (${order.quantity} disp.)` : ""}`;
  const details = [
    `Orden ${order.id}`,
    `Equipo: ${order.brand} ${order.model}`,
    `Modalidad: ${order.modality === "presencial" ? "Visita presencial" : "Videollamada"}`,
    `Técnico: ${techName}`,
    `Cliente: ${order.clientName} · ${order.phone}`,
    `Detalle: ${order.detail}`,
  ].join("\n");
  const location = order.modality === "presencial" ? (order.address ?? "") : "Videollamada";
  const start = stamp(order.date, order.start);
  const end = stamp(order.date, order.start, SERVICE_DURATION[order.modality]);
  return { title, details, location, start, end };
}

export function googleCalendarUrl(order: Order, techName: string) {
  const i = info(order, techName);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: i.title,
    dates: `${i.start}/${i.end}`,
    details: i.details,
    location: i.location,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function downloadIcs(order: Order, techName: string) {
  const i = info(order, techName);
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FixSur//ES",
    "BEGIN:VEVENT",
    `UID:${order.id}@fixsur`,
    `DTSTART:${i.start}`,
    `DTEND:${i.end}`,
    `SUMMARY:${esc(i.title)}`,
    `DESCRIPTION:${esc(i.details)}`,
    `LOCATION:${esc(i.location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio servicio técnico",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
