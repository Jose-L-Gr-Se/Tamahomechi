"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TimePickerProps {
  /** "HH:mm" string */
  value: string;
  onChange: (value: string) => void;
  /** Minute step (default 5) */
  minuteStep?: number;
  className?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function TimePicker({ value, onChange, minuteStep = 5, className }: TimePickerProps) {
  const [hh = "12", mm = "00"] = value.split(":");

  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => pad(i * minuteStep));

  const handleHourChange = (h: string) => onChange(`${h}:${mm}`);
  const handleMinuteChange = (m: string) => onChange(`${hh}:${m}`);

  // If current minute isn't aligned to step, include it as an option to avoid jumps
  const currentMinute = pad(parseInt(mm, 10) || 0);
  const minuteOptions = minutes.includes(currentMinute) ? minutes : [...minutes, currentMinute].sort();

  return (
    <div className={cn("flex items-center gap-2 rounded-lg border border-input bg-background px-3 h-10", className)}>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <select
        aria-label="Hora"
        value={hh}
        onChange={(e) => handleHourChange(e.target.value)}
        className="flex-1 bg-transparent text-sm font-medium tabular-nums focus:outline-none appearance-none text-center"
      >
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-muted-foreground font-medium">:</span>
      <select
        aria-label="Minutos"
        value={currentMinute}
        onChange={(e) => handleMinuteChange(e.target.value)}
        className="flex-1 bg-transparent text-sm font-medium tabular-nums focus:outline-none appearance-none text-center"
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
