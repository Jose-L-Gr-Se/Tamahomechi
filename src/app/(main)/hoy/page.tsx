"use client";

import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { FAB } from "@/components/layout/fab";
import { TaskCard } from "@/components/tasks/task-card";
import { EventCard } from "@/components/agenda/event-card";
import { BalanceSummary } from "@/components/expenses/expense-card";
import { EmptyState, LoadBalanceBar } from "@/components/shared";
import { useTasksForToday, useWeeklyLoad } from "@/lib/hooks/use-tasks";
import { useUpcomingEvents } from "@/lib/hooks/use-events";
import { useShoppingCount } from "@/lib/hooks/use-shopping";
import { useBalance } from "@/lib/hooks/use-expenses";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { getGreeting, isEventInReminderWindow } from "@/lib/utils/dates";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ShoppingCart, ChevronRight } from "lucide-react";

export default function HoyPage() {
  const { user } = useAuth();
  const { currentMember } = useHousehold();
  const { data: todayTasks = [], isLoading: tasksLoading } = useTasksForToday();
  const { data: upcomingEvents = [] } = useUpcomingEvents(5);
  const { data: shoppingCount = 0 } = useShoppingCount();
  const { data: balance = [] } = useBalance();
  const { data: weeklyLoad = [] } = useWeeklyLoad();

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateStr = format(now, "EEEE d 'de' MMMM", { locale: es });

  const myTasks = todayTasks.filter((t) => t.assigned_to === user?.id);
  const urgentTasks = todayTasks.filter((t) => t.priority === "urgent" && !t.is_completed);
  const alertEvents = upcomingEvents.filter((e) =>
    e.reminder_minutes_before && isEventInReminderWindow(e.starts_at, e.reminder_minutes_before)
  );

  return (
    <>
      <TopBar title="Hoy" />
      <PageShell withFab>
        <div className="space-y-6 pb-4">

          {/* 1. Header */}
          <div>
            <h2 className="text-2xl font-display font-semibold tracking-tight">
              {greeting}, {currentMember?.display_name ?? ""}
            </h2>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">{dateStr}</p>
          </div>

          {/* 2. Alerts (conditional) */}
          {(urgentTasks.length > 0 || alertEvents.length > 0) && (
            <div className="space-y-2">
              {urgentTasks.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-urgent/5 border border-urgent/20">
                  <p className="text-sm font-medium text-urgent">⚡ {t.title}</p>
                </div>
              ))}
              {alertEvents.map((e) => (
                <div key={e.id} className="p-3 rounded-xl bg-agenda/5 border border-agenda/20">
                  <p className="text-sm font-medium text-agenda">🔔 {e.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* 3. My tasks today */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Mis tareas de hoy
              </h3>
              <Link href="/tareas" className="text-xs text-primary font-medium flex items-center gap-0.5">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {tasksLoading ? (
              <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : myTasks.length > 0 ? (
              <div className="space-y-2">
                {myTasks.slice(0, 5).map((task) => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
                {todayTasks.filter((t) => t.assigned_to !== user?.id).length > 0 && (
                  <Link href="/tareas" className="block text-xs text-muted-foreground text-center py-2 hover:underline">
                    Y {todayTasks.filter((t) => t.assigned_to !== user?.id && !t.is_completed).length} tareas más del hogar
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                ✨ No tienes tareas para hoy
              </div>
            )}
          </section>

          {/* 4. Upcoming events */}
          {upcomingEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Próximos eventos
                </h3>
                <Link href="/agenda" className="text-xs text-primary font-medium flex items-center gap-0.5">
                  Ver agenda <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* 5. Shopping summary */}
          {shoppingCount > 0 && (
            <Link href="/compra" className="block">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-shopping/5 border border-shopping/15 active:bg-shopping/10 transition-colors">
                <ShoppingCart className="h-5 w-5 text-shopping" />
                <span className="text-sm font-medium">{shoppingCount} productos pendientes</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </div>
            </Link>
          )}

          {/* 6. Balance summary */}
          {balance.length > 0 && (
            <Link href="/mas/gastos" className="block">
              <BalanceSummary balance={balance} compact />
            </Link>
          )}

          {/* 7. Weekly load balance */}
          {weeklyLoad.length > 0 && <LoadBalanceBar data={weeklyLoad} />}

        </div>
      </PageShell>
      <FAB />
    </>
  );
}
