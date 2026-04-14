"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/shared";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { QuickTaskForm } from "@/components/tasks/quick-task-form";
import { useTasks } from "@/lib/hooks/use-tasks";
import { Plus } from "lucide-react";

type Filter = "today" | "pending" | "mine" | "all";

export default function TareasPage() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [showAdd, setShowAdd] = useState(false);
  const { data: tasks = [], isLoading } = useTasks(filter);

  return (
    <>
      <TopBar
        title="Tareas"
        rightAction={
          <Button size="icon" variant="ghost" onClick={() => setShowAdd(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />
      <PageShell>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="mine">Mías</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="✅"
            title={filter === "today" ? "Nada para hoy" : "Sin tareas pendientes"}
            description="Añade una tarea con el botón +"
          />
        )}
      </PageShell>

      <Drawer open={showAdd} onOpenChange={setShowAdd}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Nueva tarea</DrawerTitle></DrawerHeader>
          <QuickTaskForm onSuccess={() => setShowAdd(false)} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
