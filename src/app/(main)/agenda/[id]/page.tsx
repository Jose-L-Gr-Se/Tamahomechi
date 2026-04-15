"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { EventForm } from "@/components/agenda/event-form";
import { Button } from "@/components/ui/button";
import { useEvent, useDeleteEvent } from "@/lib/hooks/use-events";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: event, isLoading, error } = useEvent(id);
  const deleteEvent = useDeleteEvent();

  const handleDelete = () => {
    if (!confirm("¿Eliminar este evento?")) return;
    deleteEvent.mutate(id, { onSuccess: () => router.back() });
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Evento" showAvatar={false} />
        <PageShell>
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </PageShell>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <TopBar title="Evento" showAvatar={false} />
        <PageShell>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <p className="text-sm text-muted-foreground text-center py-12">
            Evento no encontrado
          </p>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Editar evento"
        showAvatar={false}
        rightAction={
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteEvent.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        }
      />
      <PageShell>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <EventForm event={event} onSuccess={() => router.back()} />
      </PageShell>
    </>
  );
}
