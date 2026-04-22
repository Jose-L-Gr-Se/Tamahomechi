"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";

interface CalendarProps {
  selected?: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  initialMonth?: Date;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function Calendar({ selected, onSelect, minDate, maxDate, initialMonth }: CalendarProps) {
  const [viewMonth, setViewMonth] = React.useState<Date>(
    initialMonth ?? selected ?? new Date()
  );

  const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const isDisabled = (d: Date) => {
    if (minDate && isBefore(d, minDate) && !isSameDay(d, minDate)) return true;
    if (maxDate && isAfter(d, maxDate) && !isSameDay(d, maxDate)) return true;
    return false;
  };

  return (
    <div className="w-[260px] select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground active:scale-95"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground active:scale-95"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-7 text-[10px] font-semibold uppercase text-muted-foreground text-center flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const isSelected = selected && isSameDay(day, selected);
          const today = isToday(day);
          const disabled = isDisabled(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={cn(
                "h-9 w-full rounded-md text-sm transition-colors active:scale-95",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : today
                  ? "bg-primary/10 text-primary font-semibold"
                  : inMonth
                  ? "text-foreground hover:bg-accent"
                  : "text-muted-foreground/40 hover:bg-accent/40"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
