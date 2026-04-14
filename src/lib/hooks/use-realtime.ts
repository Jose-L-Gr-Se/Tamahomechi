"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase realtime changes on a table, filtered by household_id.
 * On any change, invalidates the corresponding TanStack Query cache.
 */
export function useRealtimeInvalidation(table: string, householdId: string | null) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`${table}-${householdId}`)
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, householdId, queryClient, supabase]);
}
