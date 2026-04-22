"use client";

import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { UserAvatar } from "@/components/shared";
import { useCompleteTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useHousehold } from "@/providers/household-provider";
import { formatDate, getDateUrgency } from "@/lib/utils/dates";
import type { Task } from "@/lib/types";
import Link from "next/link";
import { RotateCw, ArrowLeftRight, CalendarPlus, Clock } from "lucide-react";

interface TaskCardProps {
  task: Task;
  compact?: boolean;
}

export function TaskCard({ task, compact }: TaskCardProps) {
  const completeTask = useCompleteTask();
  const updateTask = useUpdateTask();
  const { members } = useHousehold();
  const assignee = members.find((m) => m.id === task.assigned_to);
  const partner = members.find((m) => m.id !== task.assigned_to);

  const urgency = (!task.is_completed && task.due_date)
    ? getDateUrgency(task.due_date)
    : "normal";

  const isOverdue = urgency === "overdue";
  const isDueToday = urgency === "today";

  const handleCheck = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task.is_completed) completeTask.mutate(task.id);
  };

  const handleReassign = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!partner) return;
    updateTask.mutate({ id: task.id, assigned_to: partner.id });
  };

  const handleChangeDate = (newDate: string) => {
    updateTask.mutate({ id: task.id, due_date: newDate });
  };

  const stop = (e: React.MouseEvent | React.PointerEvent) => e.stopPropagation();

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl border transition-all",
        task.is_completed
          ? "opacity-50 border-transparent bg-card"
          : isOverdue
          ? "border-destructive/30 bg-destructive/[0.04]"
          : isDueToday
          ? "border-primary/25 bg-card"
          : "border-transparent bg-card",
        // Feedback táctil sólo en modo link (no compact)
        !task.is_completed && !compact && (
          isOverdue ? "active:bg-destructive/[0.07]" : "active:bg-accent"
        )
      )}
    >
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0" onClick={handleCheck}>
        <Checkbox
          checked={task.is_completed}
          className={cn(
            task.is_completed && "animate-check-bounce",
            task.priority === "urgent" && !task.is_completed && "border-urgent",
            isOverdue && !task.is_completed && "border-destructive/60"
          )}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-1.5">
          {isOverdue && !task.is_completed && (
            <Clock className="h-3 w-3 text-destructive shrink-0" />
          )}
          <p className={cn(
            "text-sm font-medium leading-snug",
            task.is_completed && "line-through text-muted-foreground",
            isOverdue && !task.is_completed && "text-destructive/90"
          )}>
            {task.title}
          </p>
        </div>

        {/* Chips row — date + badges */}
        <div
          className="flex items-center gap-1.5 mt-1 flex-wrap"
          onPointerDown={stop}
          onClick={stop}
        >
          {!task.is_completed ? (
            task.due_date ? (
              <DatePicker
                value={task.due_date}
                onChange={handleChangeDate}
                compact
                urgency={urgency}
              />
            ) : (
              <DatePicker
                value=""
                onChange={handleChangeDate}
                compact
                placeholder="Añadir fecha"
              />
            )
          ) : (
            // Tarea completada: fecha estática sin popover
            task.due_date && (
              <span className="text-xs text-muted-foreground">
                {formatDate(task.due_date)}
              </span>
            )
          )}

          {task.priority === "urgent" && (
            <Badge variant="urgent" className="text-[10px] px-1.5 py-0">Urgente</Badge>
          )}
          {task.recurrence_id && (
            <RotateCw className="h-3 w-3 text-muted-foreground" />
          )}
          {!task.due_date && !task.is_completed && (
            <CalendarPlus className="h-3 w-3 text-muted-foreground/50" />
          )}
        </div>

        {/* Mensaje "vencida hace X días" bajo el chip cuando llevan >1d de retraso */}
        {isOverdue && !task.is_completed && task.due_date && (
          <OverdueLabel dateStr={task.due_date} />
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!task.is_completed && partner && (
          <button
            type="button"
            onClick={handleReassign}
            disabled={updateTask.isPending}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={`Pasar a ${partner.display_name}`}
            aria-label={`Pasar a ${partner.display_name}`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>
        )}
        <UserAvatar member={assignee} size="sm" />
      </div>
    </div>
  );

  if (compact) return content;

  return (
    <Link href={`/tareas/${task.id}`} className="block">
      {content}
    </Link>
  );
}

/** Muestra cuántos días lleva vencida la tarea, de forma compacta. */
function OverdueLabel({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / 86400000);

  if (days <= 0) return null;

  return (
    <span className="text-[10px] text-destructive/70 font-medium">
      {days === 1 ? "Venció ayer" : `Vencida hace ${days} días`}
    </span>
  );
}
