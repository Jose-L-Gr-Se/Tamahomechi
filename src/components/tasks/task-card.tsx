"use client";

import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared";
import { useCompleteTask } from "@/lib/hooks/use-tasks";
import { useHousehold } from "@/providers/household-provider";
import { formatDate } from "@/lib/utils/dates";
import type { Task } from "@/lib/types";
import Link from "next/link";
import { RotateCw } from "lucide-react";

interface TaskCardProps {
  task: Task;
  /** If true, renders as a compact card without link behavior */
  compact?: boolean;
}

export function TaskCard({ task, compact }: TaskCardProps) {
  const completeTask = useCompleteTask();
  const { members } = useHousehold();
  const assignee = members.find((m) => m.id === task.assigned_to);

  const handleCheck = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task.is_completed) {
      completeTask.mutate(task.id);
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl transition-all",
        task.is_completed ? "opacity-50" : "bg-card",
        !compact && "active:bg-accent"
      )}
    >
      <div className="pt-0.5" onClick={handleCheck}>
        <Checkbox
          checked={task.is_completed}
          className={cn(
            task.is_completed && "animate-check-bounce",
            task.priority === "urgent" && !task.is_completed && "border-urgent"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", task.is_completed && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.due_date && (
            <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
          )}
          {task.priority === "urgent" && (
            <Badge variant="urgent" className="text-[10px] px-1.5 py-0">Urgente</Badge>
          )}
          {task.recurrence_id && (
            <RotateCw className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>

      <UserAvatar member={assignee} size="sm" />
    </div>
  );

  if (compact) return content;

  return (
    <Link href={`/tareas/${task.id}`} className="block">
      {content}
    </Link>
  );
}
