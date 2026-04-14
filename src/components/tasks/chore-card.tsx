"use client";

import { cn } from "@/lib/utils/cn";
import { useCompleteChore, useUncompleteChore, useReassignChore } from "@/lib/hooks/use-chores";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import type { ChoreAssignment } from "@/lib/hooks/use-chores";
import { Check, AlertTriangle, RotateCcw, ArrowLeftRight } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface ChoreCardProps {
  assignment: ChoreAssignment;
  weekEnd: string;
  showAssignee?: boolean;
}

export function ChoreCard({ assignment, weekEnd, showAssignee = false }: ChoreCardProps) {
  const { user } = useAuth();
  const { members } = useHousehold();
  const completeChore = useCompleteChore();
  const uncompleteChore = useUncompleteChore();
  const reassignChore = useReassignChore();

  const zone = assignment.zone;
  const assignee = members.find((m) => m.id === assignment.assigned_to);
  const partner = members.find((m) => m.id !== assignment.assigned_to);
  const isMine = assignment.assigned_to === user?.id;

  const daysLeft = differenceInDays(parseISO(weekEnd), new Date());
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft <= 1 && !assignment.is_completed;

  const handleToggle = () => {
    if (assignment.penalty_applied) return;
    if (assignment.is_completed) {
      uncompleteChore.mutate(assignment.id);
    } else {
      completeChore.mutate(assignment.id);
    }
  };

  const handleReassign = () => {
    if (!partner) return;
    reassignChore.mutate({ assignmentId: assignment.id, newUserId: partner.id });
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-2xl border transition-all",
        assignment.is_completed && "opacity-60 bg-muted/30",
        assignment.penalty_applied && "border-destructive/30 bg-destructive/5",
        !assignment.is_completed && !assignment.penalty_applied && isUrgent && "border-urgent/40 bg-urgent/5",
        !assignment.is_completed && !assignment.penalty_applied && !isUrgent && "bg-card border-border"
      )}
    >
      {/* Check button */}
      <button
        onClick={handleToggle}
        disabled={assignment.penalty_applied || completeChore.isPending || uncompleteChore.isPending}
        className={cn(
          "shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all active:scale-95",
          assignment.is_completed
            ? "bg-shopping border-shopping text-white"
            : assignment.penalty_applied
            ? "border-destructive/40 bg-destructive/10 cursor-not-allowed"
            : "border-border hover:border-primary"
        )}
      >
        {assignment.is_completed ? (
          <Check className="h-5 w-5" strokeWidth={3} />
        ) : assignment.penalty_applied ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{zone?.emoji}</span>
          <p className={cn(
            "text-sm font-semibold",
            assignment.is_completed && "line-through text-muted-foreground"
          )}>
            {zone?.name}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {assignment.penalty_applied ? (
            <span className="text-xs text-destructive font-medium">⚠️ Multa aplicada (10€)</span>
          ) : assignment.is_completed ? (
            <span className="text-xs text-shopping font-medium">✓ Completada</span>
          ) : isOverdue ? (
            <span className="text-xs text-destructive font-medium">Plazo vencido</span>
          ) : (
            <span className={cn(
              "text-xs",
              isUrgent ? "text-urgent font-medium" : "text-muted-foreground"
            )}>
              {daysLeft === 0 ? "Vence hoy" : `${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Reassign button — solo si no completada y no tiene multa */}
        {!assignment.is_completed && !assignment.penalty_applied && partner && (
          <button
            onClick={handleReassign}
            disabled={reassignChore.isPending}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={`Pasar a ${partner.display_name}`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Assignee avatar */}
        {showAssignee && assignee && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-base" title={assignee.display_name}>
            {assignee.avatar_emoji}
          </div>
        )}
      </div>
    </div>
  );
}
