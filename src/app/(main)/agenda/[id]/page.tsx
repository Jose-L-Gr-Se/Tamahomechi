"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { EventForm } from "@/components/agenda/event-form";
import { Button } from "@/components/ui/button";
import { useEvent, useDeleteEvent } from "@/lib/hooks/use-events";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: event, isLoading } = useEvent(id);
  const deleteEvent = useDeleteEvent();

  const handleDelete = () => {
    if (!confirm("¿Eliminar este evento?")) return;
    deleteEvent.mutate(id, { onSuccess: () => router.back() });
  };

  return (
    <>
      <TopBar
        title="Editar evento"
        showAvatar={false}
        rightAction={
          <Button size="icon" variant="ghost" onClick={handleDelete} disabled={deleteEvent.isPending}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        }
      />
      <PageShell>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : event ? (
          <EventForm event={event} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">Evento no encontrado</p>
        )}
      </PageShell>
    </>
  );
}
