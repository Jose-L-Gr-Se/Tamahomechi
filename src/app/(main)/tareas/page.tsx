"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { ChoreCard } from "@/components/tasks/chore-card";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCurrentChoreWeek,
  useChoreAssignments,
  useGenerateChoreWeek,
  useApplyPenalties,
} from "@/lib/hooks/use-chores";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { RefreshCw, AlertTriangle, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type View = "mine" | "all";

export default function TareasPage() {
  const [view, setView] = useState<View>("mine");
  const { user } = useAuth();
  const { members } = useHousehold();

  const { data: currentWeek, isLoading: weekLoading } = useCurrentChoreWeek();
  const { data: assignments = [], isLoading: assignmentsLoading } = useChoreAssignments(currentWeek?.id ?? null);
  const generateWeek = useGenerateChoreWeek();
  const applyPenalties = useApplyPenalties();

  const myAssignments = assignments.filter((a) => a.assigned_to === user?.id);
  const partnerAssignments = assignments.filter((a) => a.assigned_to !== user?.id);
  const displayedAssignments = view === "mine" ? myAssignments : assignments;

  const myCompleted = myAssignments.filter((a) => a.is_completed).length;
  const myTotal = myAssignments.length;
  const myPending = myTotal - myCompleted;

  const isLoading = weekLoading || assignmentsLoading;
  const weekEnd = currentWeek?.week_end;
  const daysLeft = weekEnd ? differenceInDays(parseISO(weekEnd), new Date()) : null;

  const hasPendingPenalties = assignments.some(
    (a) => !a.is_completed && !a.penalty_applied && daysLeft !== null && daysLeft < 0
  );

  return (
    <>
      <TopBar
        title="Tareas"
        rightAction={
          <div className="flex items-center gap-1">
            <Link href="/tareas/zonas">
              <Button size="icon" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => generateWeek.mutate(undefined)}
              disabled={generateWeek.isPending}
              title="Generar nueva semana"
            >
              <RefreshCw className={cn("h-4 w-4", generateWeek.isPending && "animate-spin")} />
            </Button>
          </div>
        }
      />
      <PageShell>
        {/* Alerta de multas pendientes */}
        {hasPendingPenalties && (
          <button
            onClick={() => applyPenalties.mutate()}
            disabled={applyPenalties.isPending}
            className="w-full mb-4 flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-left"
          >
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Hay tareas vencidas sin completar</p>
              <p className="text-xs text-destructive/70">Pulsa para aplicar multas de 10€</p>
            </div>
          </button>
        )}

        {/* Cabecera de semana */}
        {currentWeek && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Semana actual
              </h2>
              {daysLeft !== null && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  daysLeft < 0 ? "bg-destructive/10 text-destructive" :
                  daysLeft <= 1 ? "bg-urgent/10 text-urgent" :
                  "bg-muted text-muted-foreground"
                )}>
                  {daysLeft < 0 ? "Semana vencida" :
                   daysLeft === 0 ? "Vence hoy" :
                   `${daysLeft} días`}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(currentWeek.week_start), "d MMM", { locale: es })} – {format(parseISO(currentWeek.week_end), "d MMM yyyy", { locale: es })}
            </p>

            {/* Progress bar mis tareas */}
            {myTotal > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Mis tareas: {myCompleted}/{myTotal}</span>
                  <span className="text-xs font-medium text-shopping">{Math.round((myCompleted / myTotal) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-shopping rounded-full transition-all duration-500"
                    style={{ width: `${(myCompleted / myTotal) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as View)} className="mb-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="mine">
              Mis tareas {myPending > 0 && <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 rounded-full">{myPending}</span>}
            </TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !currentWeek ? (
          <EmptyState
            emoji="🏠"
            title="Sin semana generada"
            description="Genera la semana para repartir las tareas del hogar"
            action={
              <Button onClick={() => generateWeek.mutate()} disabled={generateWeek.isPending}>
                {generateWeek.isPending ? "Generando..." : "Generar semana"}
              </Button>
            }
          />
        ) : displayedAssignments.length === 0 ? (
          <EmptyState emoji="✨" title="¡Todo en orden!" description="No tienes tareas pendientes esta semana" />
        ) : view === "mine" ? (
          <div className="space-y-3">
            {displayedAssignments.map((assignment) => (
              <ChoreCard
                key={assignment.id}
                assignment={assignment}
                weekEnd={currentWeek.week_end}
                showAssignee={false}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mis tareas */}
            {myAssignments.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {members.find((m) => m.id === user?.id)?.avatar_emoji} Mis tareas
                </h3>
                <div className="space-y-3">
                  {myAssignments.map((assignment) => (
                    <ChoreCard
                      key={assignment.id}
                      assignment={assignment}
                      weekEnd={currentWeek.week_end}
                      showAssignee={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Tareas pareja */}
            {partnerAssignments.length > 0 && (
              <section>
                {(() => {
                  const partner = members.find((m) => m.id !== user?.id);
                  return (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {partner?.avatar_emoji} {partner?.display_name}
                    </h3>
                  );
                })()}
                <div className="space-y-3">
                  {partnerAssignments.map((assignment) => (
                    <ChoreCard
                      key={assignment.id}
                      assignment={assignment}
                      weekEnd={currentWeek.week_end}
                      showAssignee={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </PageShell>
    </>
  );
}
