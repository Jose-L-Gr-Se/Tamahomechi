import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInMinutes,
  isBefore,
  isAfter,
} from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  return format(d, "d MMM", { locale: es });
}

export function formatDateTime(dateStr: string): string {
  const d = parseISO(dateStr);
  return format(d, "d MMM, HH:mm", { locale: es });
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), "HH:mm");
}

export function formatFullDate(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE d 'de' MMMM", { locale: es });
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: es });
}

export function getGreeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** True when the date is strictly before today (past its limit). */
export function isOverdue(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), startOfDay(new Date()));
}

/** "Urgency level" of a due date for visual styling purposes. */
export type DateUrgency = "overdue" | "today" | "soon" | "normal";

export function getDateUrgency(dateStr: string): DateUrgency {
  const d = parseISO(dateStr);
  if (isBefore(d, startOfDay(new Date()))) return "overdue";
  if (isToday(d)) return "today";
  if (isTomorrow(d) || isThisWeek(d, { weekStartsOn: 1 })) return "soon";
  return "normal";
}

export function groupEventsByDay(events: Array<{ starts_at: string }>) {
  const groups: { label: string; items: typeof events }[] = [];
  const todayItems = events.filter((e) => isToday(parseISO(e.starts_at)));
  const tomorrowItems = events.filter((e) => isTomorrow(parseISO(e.starts_at)));
  const weekItems = events.filter((e) => {
    const d = parseISO(e.starts_at);
    return isThisWeek(d, { locale: es }) && !isToday(d) && !isTomorrow(d);
  });
  const laterItems = events.filter((e) => {
    const d = parseISO(e.starts_at);
    return !isThisWeek(d, { locale: es }) && !isToday(d) && !isTomorrow(d);
  });

  if (todayItems.length) groups.push({ label: "Hoy", items: todayItems });
  if (tomorrowItems.length) groups.push({ label: "Mañana", items: tomorrowItems });
  if (weekItems.length) groups.push({ label: "Esta semana", items: weekItems });
  if (laterItems.length) groups.push({ label: "Próximos", items: laterItems });

  return groups;
}

export function isEventInReminderWindow(startsAt: string, reminderMinutes: number | null): boolean {
  if (!reminderMinutes) return false;
  const eventDate = parseISO(startsAt);
  const now = new Date();
  const minutesUntil = differenceInMinutes(eventDate, now);
  return minutesUntil > 0 && minutesUntil <= reminderMinutes;
}

export function getWeekRange() {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export { isToday, isTomorrow, isBefore, isAfter, parseISO, startOfDay, endOfDay, addDays, format };
