"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHousehold } from "@/providers/household-provider";
import { useCreateEvent, useUpdateEvent } from "@/lib/hooks/use-events";
import { EVENT_TYPES, REMINDER_OPTIONS } from "@/lib/constants";
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

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      event_type: event?.event_type ?? "otro",
      date: event?.starts_at ? toDateString(event.starts_at) : "",
      time: event?.starts_at ? toTimeString(event.starts_at) : "12:00",
      all_day: event?.all_day ?? false,
      assigned_to: event?.assigned_to ?? null,
      reminder_minutes_before: event?.reminder_minutes_before ?? null,
    },
  });

  const allDay = form.watch("all_day");

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-4">

      {/* Título */}
      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input
          placeholder="Cita, reunión, recordatorio..."
          autoFocus
          {...form.register("title")}
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

      {/* Todo el día */}
      <div className="flex items-center justify-between py-1">
        <Label>Todo el día</Label>
        <button
          type="button"
          onClick={() => form.setValue("all_day", !allDay)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            allDay ? "bg-primary" : "bg-muted"
          )}
        >
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            allDay ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <Label>Fecha</Label>
        <Input
          type="date"
          {...form.register("date")}
        />
        {form.formState.errors.date && (
          <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      {/* Hora */}
      {!allDay && (
        <div className="space-y-1.5">
          <Label>Hora</Label>
          <Input
            type="time"
            {...form.register("time")}
          />
        </div>
      )}

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
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors",
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
        <Label>
          Notas{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <textarea
          className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Dirección, qué llevar..."
          {...form.register("description")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear evento"}
      </Button>
    </form>
  );
}
