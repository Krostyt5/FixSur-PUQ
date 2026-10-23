import { CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import { technicianName } from "@/lib/store";
import type { Order } from "@/lib/domain";

export function CalendarButtons({ order }: { order: Order }) {
  const tech = technicianName(order.technicianId);
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <a href={googleCalendarUrl(order, tech)} target="_blank" rel="noreferrer">
          <CalendarPlus className="size-4" /> Google Calendar
        </a>
      </Button>
      <Button size="sm" variant="outline" onClick={() => downloadIcs(order, tech)}>
        <Download className="size-4" /> iPhone / Outlook
      </Button>
    </div>
  );
}
