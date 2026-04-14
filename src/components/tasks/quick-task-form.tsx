"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { useHousehold } from "@/providers/household-provider";
import { todayISO } from "@/lib/utils/dates";

const quickTaskSchema = z.object({
  title: z.string().min(1, "Título obligatorio"),
  assigned_to: z.string().nullable(),
});

type QuickTaskValues = z.infer<typeof quickTaskSchema>;

export function QuickTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const { members, currentMember, partner } = useHousehold();
  const createTask = useCreateTask();

  const form = useForm<QuickTaskValues>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: { title: "", assigned_to: null },
  });

  const onSubmit = (values: QuickTaskValues) => {
    createTask.mutate(
      {
        title: values.title,
        category: "general",
        priority: "normal",
        due_date: todayISO(),
        assigned_to: values.assigned_to,
        is_recurring: false,
      },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="¿Qué hay que hacer?"
          autoFocus
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Asignar a</Label>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                form.watch("assigned_to") === opt.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input text-muted-foreground"
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createTask.isPending}>
        {createTask.isPending ? "Guardando..." : "Añadir tarea"}
      </Button>
    </form>
  );
}
