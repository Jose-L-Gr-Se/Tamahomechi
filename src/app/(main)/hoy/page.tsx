"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { ChoreCard } from "@/components/tasks/chore-card";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  useCurrentChoreWeek,
  useChoreAssignments,
  useGenerateChoreWeek,
} from "@/lib/hooks/use-chores";
import { useUpcomingEvents } from "@/lib/hooks/use-events";
import { useShoppingCount } from "@/lib/hooks/use-shopping";
import { useBalance } from "@/lib/hooks/use-expenses";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { getGreeting } from "@/lib/utils/dates";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ShoppingCart, ChevronRight, Calendar } from "lucide-react";

export default function HoyPage() {
  const { user } = useAuth();
  const { currentMember } = useHousehold();
  const { data: currentWeek } = useCurrentChoreWeek();
  const { data: assignments = [] } = useChoreAssignments(currentWeek?.id ?? null);
  const { data: upcomingEvents = [] } = useUpcomingEvents(5);
  const { data: shoppingCount = 0 } = useShoppingCount();
  const { data: balance = [] } = useBalance();
  const generateWeek = useGenerateChoreWeek();

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateStr = format(now, "EEEE d 'de' MMMM", { locale: es });

  const myChores = assignments.filter((a) => a.assigned_to === user?.id && !a.is_completed);

  return (
    <>
      <TopBar title="Hoy" />
      <PageShell>
        <div className="space-y-6 pb-4">

          {/* 1. Header */}
          <div>
            <h2 className="text-2xl font-display font-semibold tracking-tight">
              {greeting}, {currentMember?.display_name ?? ""}
            </h2>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">{dateStr}</p>
          </div>

          {/* 2. Chores this week */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Mis tareas esta semana
              </h3>
              <Link href="/tareas" className="text-xs text-primary font-medium flex items-center gap-0.5">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {!currentWeek ? (
              <EmptyState
                emoji="🏠"
                title="Sin semana generada"
                description="Genera la semana para ver tus tareas"
                action={
                  <Button size="sm" onClick={() => generateWeek.mutate()} disabled={generateWeek.isPending}>
                    {generateWeek.isPending ? "Generando..." : "Generar semana"}
                  </Button>
                }
              />
            ) : myChores.length > 0 ? (
              <div className="space-y-3">
                {myChores.slice(0, 3).map((chore) => (
                  <ChoreCard
                    key={chore.id}
                    assignment={chore}
                    weekEnd={currentWeek.week_end}
                    showAssignee={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                ✨ No tienes tareas esta semana
              </div>
            )}
          </section>

          {/* 3. Upcoming events */}
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
                  <Link key={event.id} href={`/agenda/${event.id}`}>
                    <div className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors active:bg-accent/50">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(event.starts_at), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 4. Shopping summary */}
          {shoppingCount > 0 && (
            <Link href="/compra" className="block">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-shopping/5 border border-shopping/15 active:bg-shopping/10 transition-colors">
                <ShoppingCart className="h-5 w-5 text-shopping" />
                <span className="text-sm font-medium">{shoppingCount} productos pendientes</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </div>
            </Link>
          )}

          {/* 5. Balance summary */}
          {balance.length > 0 && (
            <Link href="/mas/gastos" className="block">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-2">Balance</h4>
                {balance.map((b) => (
                  <div key={b.user_id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{b.display_name}</span>
                    <span className={b.net_balance > 0 ? "text-green-600" : b.net_balance < 0 ? "text-red-600" : "text-muted-foreground"}>
                      {b.net_balance > 0 ? "+" : ""}{Number(b.net_balance).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          )}

        </div>
      </PageShell>
    </>
  );
}
