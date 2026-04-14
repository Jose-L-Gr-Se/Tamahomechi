"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient(); // fuera del hook, instancia única

export function useRealtimeInvalidation(table: string, householdId: string | null) {
  const queryClient = useQueryClient();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!householdId || subscribedRef.current) return;

    subscribedRef.current = true;
    const channelName = `${table}-${householdId}`;

    const channel = supabase
      .channel(channelName)
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
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [table, householdId, queryClient]);
}
