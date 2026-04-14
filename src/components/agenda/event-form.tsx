"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHousehold } from "@/providers/household-provider";
import { useCreateEvent, useUpdateEvent } from "@/lib/hooks/use-events";
import { EVENT_TYPES, REMINDER_OPTIONS } from "@/lib/constants";
import type { Event, CreateEventInput } from "@/lib/types";
import { useRouter } from "next/navigation";

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
}

export function EventForm({ event, onSuccess }: EventFormProps) {
  const router = useRouter();
  const { currentMember, partner } = useHousehold();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditing = !!event;

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      event_type: event?.event_type ?? "otro",
      starts_at: event?.starts_at ? event.starts_at.slice(0, 16) : "",
      all_day: event?.all_day ?? false,
      assigned_to: event?.assigned_to ?? null,
      reminder_minutes_before: event?.reminder_minutes_before ?? null,
    },
  });

  const onSubmit = (values: CreateEventInput) => {
    // Ensure proper ISO format
    const startsAt = values.all_day
      ? new Date(values.starts_at + "T00:00:00").toISOString()
      : new Date(values.starts_at).toISOString();

    const payload = { ...values, starts_at: startsAt };

    if (isEditing) {
      updateEvent.mutate({ id: event.id, ...payload }, {
        onSuccess: () => { onSuccess?.(); router.back(); },
      });
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => { onSuccess?.(); router.back(); },
      });
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input placeholder="Cita, reunión, recordatorio..." autoFocus {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <Select
          value={form.watch("event_type")}
          onValueChange={(v) => form.setValue("event_type", v as CreateEventInput["event_type"])}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => form.setValue("all_day", !form.watch("all_day"))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.watch("all_day") ? "bg-primary" : "bg-muted"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            form.watch("all_day") ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
        <Label>Todo el día</Label>
      </div>

      <div className="space-y-1.5">
        <Label>Fecha{!form.watch("all_day") && " y hora"}</Label>
        <Input
          type={form.watch("all_day") ? "date" : "datetime-local"}
          {...form.register("starts_at")}
        />
        {form.formState.errors.starts_at && (
          <p className="text-xs text-destructive">{form.formState.errors.starts_at.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Para quién</Label>
        <div className="flex gap-2">
          {[
            { id: null, label: "Ambos", emoji: "👥" },
            ...(currentMember ? [{ id: currentMember.id, label: "Yo", emoji: currentMember.avatar_emoji }] : []),
            ...(partner ? [{ id: partner.id, label: partner.display_name, emoji: partner.avatar_emoji }] : []),
          ].map((opt) => (
            <button
              key={opt.id ?? "both"}
              type="button"
              onClick={() => form.setValue("assigned_to", opt.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                form.watch("assigned_to") === opt.id
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-input text-muted-foreground"
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Recordatorio</Label>
        <Select
          value={String(form.watch("reminder_minutes_before") ?? "null")}
          onValueChange={(v) => form.setValue("reminder_minutes_before", v === "null" ? null : parseInt(v) as 60 | 1440 | 4320)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {REMINDER_OPTIONS.map((r) => (
              <SelectItem key={String(r.value)} value={String(r.value ?? "null")}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
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
