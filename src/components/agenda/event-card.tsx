"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared";
import { useHousehold } from "@/providers/household-provider";
import { formatTime, formatMonthYear } from "@/lib/utils/dates";
import { EVENT_TYPES } from "@/lib/constants";
import type { Event } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ---- Event Card ----
interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { members } = useHousehold();
  const assignee = members.find((m) => m.id === event.assigned_to);
  const typeInfo = EVENT_TYPES.find((t) => t.value === event.event_type);

  return (
    <Link href={`/agenda/${event.id}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card active:bg-accent transition-all">
        <div className="flex flex-col items-center justify-center w-12 shrink-0">
          <span className="text-lg">{typeInfo?.emoji ?? "📌"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug truncate">{event.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {event.all_day ? "Todo el día" : formatTime(event.starts_at)}
            {event.assigned_to === null && " · Ambos"}
          </p>
        </div>
        {assignee && <UserAvatar member={assignee} size="sm" />}
      </div>
    </Link>
  );
}

// ---- Calendar Month View ----
interface CalendarMonthProps {
  events: Event[];
  taskDays?: Set<number>;
  year: number;
  month: number;
  onChangeMonth: (year: number, month: number) => void;
  selectedDay?: number | null;
  onSelectDay?: (day: number | null) => void;
}

export function CalendarMonth({
  events,
  taskDays,
  year,
  month,
  onChangeMonth,
  selectedDay,
  onSelectDay,
}: CalendarMonthProps) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Monday = 0 start
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const eventDays = new Set(
    events.map((e) => new Date(e.starts_at).getDate())
  );

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    onChangeMonth(d.getFullYear(), d.getMonth());
    onSelectDay?.(null);
  };

  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    onChangeMonth(d.getFullYear(), d.getMonth());
    onSelectDay?.(null);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-3">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold capitalize">{formatMonthYear(firstDay)}</h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-accent">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <span key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const isToday = isCurrentMonth && day === today.getDate();
          const isSelected = selectedDay === day;
          const hasEvent = eventDays.has(day);
          const hasTask = taskDays?.has(day) ?? false;

          return (
            <button
              key={day}
              onClick={() => onSelectDay?.(isSelected ? null : day)}
              className="flex flex-col items-center py-1.5 w-full"
            >
              <span
                className={cn(
                  "text-xs w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  isSelected && "bg-primary text-primary-foreground font-bold",
                  !isSelected && isToday && "bg-primary/20 text-primary font-bold",
                  !isSelected && !isToday && "text-foreground hover:bg-accent"
                )}
              >
                {day}
              </span>
              <div className="flex gap-0.5 mt-0.5 h-1">
                {hasEvent && <div className="w-1 h-1 rounded-full bg-agenda" />}
                {hasTask && <div className="w-1 h-1 rounded-full bg-primary" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
