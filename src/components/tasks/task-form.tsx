"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useHousehold } from "@/providers/household-provider";
import { useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { TASK_CATEGORIES, FREQUENCIES, DAYS_OF_WEEK } from "@/lib/constants";
import { todayISO } from "@/lib/utils/dates";
import type { Task, CreateTaskInput } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TaskFormProps {
  task?: Task;
  onSuccess?: () => void;
}

export function TaskForm({ task, onSuccess }: TaskFormProps) {
  const router = useRouter();
  const { currentMember, partner } = useHousehold();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEditing = !!task;
  const [isRecurring, setIsRecurring] = useState(!!task?.recurrence_id);

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      category: task?.category ?? "general",
      priority: task?.priority ?? "normal",
      due_date: task?.due_date ?? todayISO(),
      assigned_to: task?.assigned_to ?? null,
      is_recurring: !!task?.recurrence_id,
      frequency: "weekly",
      frequency_config: {},
      rotate_assignee: false,
    },
  });

  const onSubmit = (values: CreateTaskInput) => {
    if (isEditing) {
      updateTask.mutate(
        {
          id: task.id,
          title: values.title,
          description: values.description || null,
          category: values.category,
          priority: values.priority,
          due_date: values.due_date,
          assigned_to: values.assigned_to,
        },
        {
          onSuccess: () => {
            onSuccess?.();
            router.back();
          },
        }
      );
    } else {
      createTask.mutate(
        { ...values, is_recurring: isRecurring },
        {
          onSuccess: () => {
            onSuccess?.();
            router.back();
          },
        }
      );
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input placeholder="¿Qué hay que hacer?" autoFocus {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Contexto, notas, teléfonos..."
          {...form.register("description")}
        />
      </div>

      {/* Category + Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(v) => form.setValue("category", v as CreateTaskInput["category"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Prioridad</Label>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) => form.setValue("priority", v as "normal" | "urgent")}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due date — esta es la fecha LÍMITE de la tarea */}
      <div className="space-y-1.5">
        <Label>Fecha límite</Label>
        <DatePicker
          value={form.watch("due_date") ?? ""}
          onChange={(v) => form.setValue("due_date", v)}
          placeholder="Sin fecha"
        />
        <p className="text-[11px] text-muted-foreground">
          Día tope para tenerla hecha. Puedes moverla cuando quieras desde la lista.
        </p>
      </div>

      {/* Assigned to */}
      <div className="space-y-1.5">
        <Label>Asignar a</Label>
        <div className="flex gap-2">
          {[
            { id: null, label: "Sin asignar", emoji: "👥" },
            ...(currentMember ? [{ id: currentMember.id, label: "Yo", emoji: currentMember.avatar_emoji }] : []),
            ...(partner ? [{ id: partner.id, label: partner.display_name, emoji: partner.avatar_emoji }] : []),
          ].map((opt) => (
            <button
              key={opt.id ?? "none"}
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

      {/* Recurrence (only for create) */}
      {!isEditing && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Tarea recurrente</Label>
            <button
              type="button"
              onClick={() => {
                setIsRecurring(!isRecurring);
                form.setValue("is_recurring", !isRecurring);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRecurring ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRecurring ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {isRecurring && (
            <div className="space-y-3 animate-slide-up">
              <div className="space-y-1.5">
                <Label className="text-xs">Frecuencia</Label>
                <Select
                  value={form.watch("frequency") ?? "weekly"}
                  onValueChange={(v) => form.setValue("frequency", v as CreateTaskInput["frequency"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.watch("frequency") === "weekly" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Día de la semana</Label>
                  <Select
                    value={String(form.watch("frequency_config")?.day_of_week ?? 1)}
                    onValueChange={(v) => form.setValue("frequency_config", { day_of_week: parseInt(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.watch("frequency") === "monthly" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Día del mes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    defaultValue={1}
                    onChange={(e) => form.setValue("frequency_config", { day_of_month: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}

              {form.watch("frequency") === "custom" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Cada N días</Label>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={7}
                    onChange={(e) => form.setValue("frequency_config", { every_n_days: parseInt(e.target.value) || 7 })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs">Rotar asignación</Label>
                <button
                  type="button"
                  onClick={() => form.setValue("rotate_assignee", !form.watch("rotate_assignee"))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.watch("rotate_assignee") ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.watch("rotate_assignee") ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear tarea"}
      </Button>
    </form>
  );
}
