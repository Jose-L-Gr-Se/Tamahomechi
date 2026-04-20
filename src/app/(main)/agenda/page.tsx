"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { EventCard, CalendarMonth } from "@/components/agenda/event-card";
import { EventForm } from "@/components/agenda/event-form";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useEvents, useEventsForMonth } from "@/lib/hooks/use-events";
import { useTasksForDate, useTasksForMonth } from "@/lib/hooks/use-tasks";
import { groupEventsByDay, formatFullDate } from "@/lib/utils/dates";
import { Plus, List, CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

type ViewMode = "list" | "month";

function TaskItem({ task }: { task: { id: string; title: string; priority: string; category: string; is_completed: boolean } }) {
  return (
    <Link href={`/tareas/${task.id}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card active:bg-accent transition-all">
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0",
          task.priority === "urgent" ? "bg-urgent" : "bg-primary/40"
        )} />
        <p className={cn(
          "text-sm font-medium flex-1 truncate",
          task.is_completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        <span className="text-xs text-muted-foreground capitalize">{task.category}</span>
      </div>
    </Link>
  );
}

export default function AgendaPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [showAdd, setShowAdd] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: events = [], isLoading } = useEvents();
  const { data: monthEvents = [] } = useEventsForMonth(calYear, calMonth);
  const { data: monthTasks = [] } = useTasksForMonth(calYear, calMonth);

  const selectedDateISO = selectedDay != null
    ? `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;

  const { data: dayEvents } = useEventsForDate(selectedDateISO, monthEvents);
  const { data: dayTasks = [] } = useTasksForDate(selectedDateISO);

  const taskDays = new Set(
    monthTasks.map((t) => {
      const d = new Date(t.due_date + "T00:00:00");
      return d.getDate();
    })
  );

  const grouped = groupEventsByDay(events);

  return (
    <>
      <TopBar
        title="Agenda"
        rightAction={
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant={view === "list" ? "secondary" : "ghost"}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={view === "month" ? "secondary" : "ghost"}
              onClick={() => setView("month")}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setShowAdd(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        }
      />
      <PageShell>
        {view === "month" && (
          <>
            <div className="mb-4 bg-card rounded-xl p-4 border">
              <CalendarMonth
                events={monthEvents}
                taskDays={taskDays}
                year={calYear}
                month={calMonth}
                onChangeMonth={(y, m) => { setCalYear(y); setCalMonth(m); setSelectedDay(null); }}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            </div>

            {/* Selected day panel */}
            {selectedDay != null && selectedDateISO && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">
                    {formatFullDate(selectedDateISO)}
                  </h3>
                  <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-accent">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {dayEvents.length === 0 && dayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Sin eventos ni tareas este día</p>
                ) : (
                  <>
                    {dayEvents.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eventos</p>
                        {dayEvents.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                    {dayTasks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tareas</p>
                        {dayTasks.map((task: any) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {view === "list" && (
          isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : grouped.length > 0 ? (
            <div className="space-y-5">
              {grouped.map((group) => (
                <section key={group.label}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.items.map((event: any) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📅"
              title="Sin eventos próximos"
              description="Añade citas y recordatorios con el botón +"
            />
          )
        )}
      </PageShell>

      <Drawer open={showAdd} onOpenChange={setShowAdd}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Nuevo evento</DrawerTitle></DrawerHeader>
          <EventForm onSuccess={() => setShowAdd(false)} />
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Filter month events for a specific day using local timezone (matches CalendarMonth dot logic)
function useEventsForDate(dateISO: string | null, monthEvents: import("@/lib/types").Event[]) {
  const filtered = dateISO
    ? monthEvents.filter((e) => {
        const d = new Date(e.starts_at);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return local === dateISO;
      })
    : [];
  return { data: filtered };
}
