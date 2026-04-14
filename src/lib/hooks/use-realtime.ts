"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export function useRealtimeInvalidation(table: string, householdId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!householdId) return;

    const key = `${table}-${householdId}`;

    // Si ya existe un canal activo para esta combinación, no crear otro
    if (activeChannels.has(key)) return;

    const channel = supabase
      .channel(key)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [table, householdId] });
        }
      )
      .subscribe();

    activeChannels.set(key, channel);

    return () => {
      activeChannels.delete(key);
      supabase.removeChannel(channel);
    };
  }, [table, householdId, queryClient]);
}
