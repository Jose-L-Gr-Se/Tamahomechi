"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useChoreZones,
  useChoreDefinitions,
  useUpdateZone,
  useAddChoreDefinition,
  useDeleteChoreDefinition,
  useRegenerateChoreWeek,
} from "@/lib/hooks/use-chores";
import { useHousehold } from "@/providers/household-provider";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import type { ChoreZone } from "@/lib/hooks/use-chores";

const supabase = createClient();

function ZoneRow({ zone }: { zone: ChoreZone }) {
  const [expanded, setExpanded] = useState(false);
  const [newTask, setNewTask] = useState("");
  const { householdId } = useHousehold();
  const updateZone = useUpdateZone();
  const addDef = useAddChoreDefinition();
  const deleteDef = useDeleteChoreDefinition();
  const { data: definitions = [] } = useChoreDefinitions(expanded ? zone.id : null);

  const handleAddTask = () => {
    if (!newTask.trim() || !householdId) return;
    addDef.mutate(
      { zoneId: zone.id, householdId, title: newTask.trim() },
      { onSuccess: () => setNewTask("") }
    );
  };

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      !zone.is_active && "opacity-50"
    )}>
      <div className="flex items-center gap-3 p-4">
        <span className="text-2xl">{zone.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{zone.name}</p>
          <p className="text-xs text-muted-foreground">
            {zone.is_active ? "Activa" : "Inactiva"}
            {zone.is_fixed && " · Fija siempre"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateZone.mutate({ id: zone.id, is_active: !zone.is_active })}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              zone.is_active ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
              zone.is_active ? "translate-x-4" : "translate-x-1"
            )} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tareas</p>
          {definitions.map((def) => (
            <div key={def.id} className="flex items-center gap-2">
              <span className="text-xs flex-1 text-foreground">{def.title}</span>
              <button
                onClick={() => deleteDef.mutate({ id: def.id, zoneId: zone.id })}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Nueva tarea..."
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddTask}
              disabled={!newTask.trim() || addDef.isPending}
              className="h-8 px-2"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ZonasPage() {
  const router = useRouter();
  const { householdId } = useHousehold();
  const { data: zones = [], isLoading } = useChoreZones();
  const regenerateWeek = useRegenerateChoreWeek();
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegenerateWeek = async () => {
    if (!householdId) return;
    if (!confirm("Se eliminarán las asignaciones actuales y se generará una nueva semana. ¿Continuar?")) {
      return;
    }

    setRegenerating(true);
    try {
      await regenerateWeek.mutateAsync(undefined);
      setShowConfirm(false);
      router.push("/tareas");
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <TopBar title="Estancias" showAvatar={false} />
      <PageShell>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <p className="text-sm text-muted-foreground mb-4">
          Activa o desactiva estancias y gestiona sus tareas. Las marcadas como "Fija" aparecen todas las semanas.
        </p>

        {/* Zonas */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {zones.map((zone) => (
              <ZoneRow key={zone.id} zone={zone} />
            ))}
          </div>
        )}

        {/* Sección regenerar semana */}
        <div className="border-t pt-6 mt-2">
          <h3 className="text-sm font-semibold mb-1">Semana actual</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Borra la semana actual y genera una nueva distribución. Útil si cambiásteis de miembros o queréis rehacer el reparto.
          </p>

          {!showConfirm ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowConfirm(true)}
            >
              <RefreshCw className="h-4 w-4" />
              Regenerar semana
            </Button>
          ) : (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  Esto borrará todas las asignaciones de la semana actual, incluidas las ya completadas. No se puede deshacer.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  disabled={regenerating}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={handleRegenerateWeek}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {regenerating ? "Regenerando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
