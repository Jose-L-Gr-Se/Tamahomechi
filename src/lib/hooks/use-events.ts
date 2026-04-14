"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { useRealtimeInvalidation } from "./use-realtime";
import type { Event, CreateEventInput } from "@/lib/types";

const supabase = createClient();

export function useEvents() {
  const { householdId } = useHousehold();

  useRealtimeInvalidation("events", householdId);

  return useQuery({
    queryKey: ["events", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("household_id", householdId!)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!householdId,
    staleTime: 0,
  });
}

export function useEventsForMonth(year: number, month: number) {
  const { householdId } = useHousehold();
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  return useQuery({
    queryKey: ["events", householdId, "month", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("household_id", householdId!)
        .gte("starts_at", startDate)
        .lte("starts_at", endDate)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!householdId,
  });
}

export function useUpcomingEvents(limit: number = 5) {
  const { householdId } = useHousehold();

  useRealtimeInvalidation("events", householdId);

  return useQuery({
    queryKey: ["events", householdId, "upcoming", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("household_id", householdId!)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!householdId,
    staleTime: 0,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          household_id: householdId!,
          title: input.title,
          description: input.description || null,
          event_type: input.event_type,
          starts_at: input.starts_at,
          ends_at: input.ends_at || null,
          all_day: input.all_day,
          assigned_to: input.assigned_to,
          reminder_minutes_before: input.reminder_minutes_before,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", householdId] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Event>) => {
      const { data, error } = await supabase.from("events").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", householdId] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", householdId] });
    },
  });
}
