"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { useHousehold } from "@/providers/household-provider";
import { useCreateEvent, useUpdateEvent } from "@/lib/hooks/use-events";
import { EVENT_TYPES } from "@/lib/constants";
import type { Event } from "@/lib/types";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";

const eventSchema = z.object({
  title: z.string().min(1, "Título obligatorio").max(200),
  description: z.string().max(1000).optional(),
  event_type: z.enum(["cita_medica", "veterinario", "hogar", "personal", "otro"]),
  date: z.string().min(1, "Fecha obligatoria"),
  time: z.string().optional(),
  all_day: z.boolean(),
  assigned_to: z.string().nullable(),
  reminder_minutes_before: z.number().nullable(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
}

function toDateString(isoString: string): string {
  try {
    return format(parseISO(isoString), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

function toTimeString(isoString: string): string {
  try {
    return format(parseISO(isoString), "HH:mm");
  } catch {
    return "12:00";
  }
}

function toISOString(date: string, time: string, allDay: boolean): string {
  if (!date) return new Date().toISOString();
  try {
    if (allDay) {
      return new Date(date + "T00:00:00").toISOString();
    }
    return new Date(`${date}T${time || "12:00"}:00`).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function EventForm({ event, onSuccess }: EventFormProps) {
  const router = useRouter();
  const { currentMember, partner } = useHousehold();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditing = !!event;
  const titleRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      event_type: event?.event_type ?? "otro",
      date: event?.starts_at ? toDateString(event.starts_at) : format(new Date(), "yyyy-MM-dd"),
      time: event?.starts_at ? toTimeString(event.starts_at) : "12:00",
      all_day: event?.all_day ?? false,
      assigned_to: event?.assigned_to ?? null,
      reminder_minutes_before: event?.reminder_minutes_before ?? null,
    },
  });

  const allDay = form.watch("all_day");
  const date = form.watch("date");
  const time = form.watch("time");

  // Defer focus until after Drawer animation: avoids iOS Safari keyboard
  // pushing the form contents off-screen and stealing focus mid-transition.
  useEffect(() => {
    if (isEditing) return;
    const t = setTimeout(() => {
      titleRef.current?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [isEditing]);

  const onSubmit = (values: EventFormValues) => {
    const starts_at = toISOString(values.date, values.time ?? "12:00", values.all_day);

    const payload = {
      title: values.title,
      description: values.description || undefined,
      event_type: values.event_type,
      starts_at,
      all_day: values.all_day,
      assigned_to: values.assigned_to,
      reminder_minutes_before: values.reminder_minutes_before as 60 | 1440 | 4320 | null,
    };

    if (isEditing) {
      updateEvent.mutate(
        { id: event.id, ...payload },
        {
          onSuccess: () => {
            onSuccess?.();
            router.back();
          },
        }
      );
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  const assignOptions = [
    { id: null as string | null, label: "Ambos", emoji: "👥" },
    ...(currentMember ? [{ id: currentMember.id, label: "Yo", emoji: currentMember.avatar_emoji }] : []),
    ...(partner ? [{ id: partner.id, label: partner.display_name, emoji: partner.avatar_emoji }] : []),
  ];

  const reminderOptions = [
    { value: null as number | null, label: "Sin recordatorio" },
    { value: 60, label: "1 hora antes" },
    { value: 1440, label: "1 día antes" },
    { value: 4320, label: "3 días antes" },
  ];

  const titleReg = form.register("title");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

      {/* Título */}
      <div className="space-y-1.5">
        <Label htmlFor="event-title">Título</Label>
        <Input
          id="event-title"
          placeholder="Cita, reunión, recordatorio..."
          autoComplete="off"
          enterKeyHint="next"
          {...titleReg}
          ref={(el) => {
            titleReg.ref(el);
            titleRef.current = el;
          }}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <Select
          value={form.watch("event_type")}
          onValueChange={(v) => form.setValue("event_type", v as EventFormValues["event_type"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tipo" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fecha + hora juntos para mejor flujo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Cuándo</Label>
          <button
            type="button"
            onClick={() => {
              const next = !allDay;
              form.setValue("all_day", next);
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate?.(10);
              }
            }}
            className={cn(
              "inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
              allDay
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
            aria-pressed={allDay}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                allDay ? "bg-primary-foreground" : "bg-muted-foreground/40"
              )}
            />
            Todo el día
          </button>
        </div>

        <div className={cn("grid gap-2", !allDay && "grid-cols-[1fr_auto]")}>
          <DatePicker
            value={date}
            onChange={(v) => form.setValue("date", v, { shouldValidate: true })}
            placeholder="Selecciona fecha"
          />
          {!allDay && (
            <TimePicker
              value={time || "12:00"}
              onChange={(v) => form.setValue("time", v)}
            />
          )}
        </div>

        {form.formState.errors.date && (
          <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      {/* Para quién */}
      <div className="space-y-1.5">
        <Label>Para quién</Label>
        <div className="flex gap-2 flex-wrap">
          {assignOptions.map((opt) => (
            <button
              key={opt.id ?? "both"}
              type="button"
              onClick={() => form.setValue("assigned_to", opt.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors active:scale-[0.98]",
                form.watch("assigned_to") === opt.id
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-input text-muted-foreground"
              )}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recordatorio */}
      <div className="space-y-1.5">
        <Label>Recordatorio</Label>
        <Select
          value={String(form.watch("reminder_minutes_before") ?? "null")}
          onValueChange={(v) =>
            form.setValue("reminder_minutes_before", v === "null" ? null : Number(v))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sin recordatorio" />
          </SelectTrigger>
          <SelectContent>
            {reminderOptions.map((r) => (
              <SelectItem key={String(r.value)} value={String(r.value ?? "null")}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="event-notes">
          Notas{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <textarea
          id="event-notes"
          rows={3}
          className="flex min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Dirección, qué llevar..."
          {...form.register("description")}
          onFocus={(e) => {
            // When the mobile keyboard opens, scroll the textarea into view
            // inside its drawer so the user can see what they're typing.
            const el = e.currentTarget;
            setTimeout(() => {
              el.scrollIntoView({ block: "center", behavior: "smooth" });
            }, 300);
          }}
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={isPending}>
        {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear evento"}
      </Button>
    </form>
  );
}
