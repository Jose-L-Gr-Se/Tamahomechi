"use client";

import * as React from "react";
import { addDays, format, parseISO, nextSaturday, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils/cn";
import type { DateUrgency } from "@/lib/utils/dates";

interface DatePickerProps {
  /** ISO date string (yyyy-MM-dd) or empty string */
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  placeholder?: string;
  className?: string;
  /** Show the quick shortcut row (Hoy, Mañana, +1 sem, Sábado) */
  showShortcuts?: boolean;
  /** Render as compact chip (used inline in cards) */
  compact?: boolean;
  /** Controls chip colour in compact mode */
  urgency?: DateUrgency;
}

function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseValue(v: string): Date | null {
  if (!v) return null;
  try {
    const d = parseISO(v);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

function displayLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff < 7) return format(d, "EEEE", { locale: es });
  return format(d, "d MMM", { locale: es });
}

const compactColors: Record<NonNullable<DateUrgency>, string> = {
  overdue: "text-destructive font-semibold hover:bg-destructive/10",
  today:   "text-primary font-semibold hover:bg-primary/10",
  soon:    "text-foreground hover:bg-accent",
  normal:  "text-muted-foreground hover:bg-accent hover:text-foreground",
};

export function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Seleccionar fecha",
  className,
  showShortcuts = true,
  compact = false,
  urgency = "normal",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseValue(value);

  const handleSelect = (d: Date) => {
    onChange(toISO(d));
    setOpen(false);
  };

  const today = new Date();
  const shortcuts: Array<{ label: string; date: Date }> = [
    { label: "Hoy", date: today },
    { label: "Mañana", date: addDays(today, 1) },
    { label: "+1 sem", date: addDays(today, 7) },
    { label: "Sábado", date: nextSaturday(today) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            compact
              ? cn("inline-flex items-center gap-1 text-xs rounded-md px-1.5 py-0.5 transition-colors", compactColors[urgency])
              : "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
            className
          )}
        >
          <CalendarIcon className={cn(
            compact ? "h-3 w-3" : "h-4 w-4 text-muted-foreground",
            compact && urgency === "overdue" && "text-destructive"
          )} />
          <span className={cn(!selected && !compact && "text-muted-foreground")}>
            {selected ? displayLabel(selected) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        {showShortcuts && (
          <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleSelect(s.date)}
                className="text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors active:scale-95"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <Calendar
          selected={selected}
          onSelect={handleSelect}
          minDate={minDate}
        />
      </PopoverContent>
    </Popover>
  );
}
