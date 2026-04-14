"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { useRealtimeInvalidation } from "./use-realtime";
import type { Task, TaskRecurrence, CreateTaskInput } from "@/lib/types";
import { todayISO, getWeekRange } from "@/lib/utils/dates";
import { format } from "date-fns";

const supabase = createClient();

// ---- Queries ----

export function useTasks(filter: "today" | "pending" | "mine" | "all" = "all") {
  const { householdId } = useHousehold();
  const { user } = useAuth();

  useRealtimeInvalidation("tasks", householdId);

  return useQuery({
    queryKey: ["tasks", householdId, filter],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("household_id", householdId!)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      switch (filter) {
        case "today":
          query = query.eq("is_completed", false).eq("due_date", todayISO());
          break;
        case "pending":
          query = query.eq("is_completed", false);
          break;
        case "mine":
          query = query.eq("is_completed", false).eq("assigned_to", user!.id);
          break;
        case "all":
          // Show non-completed first, then completed recent
          query = query.order("is_completed", { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!householdId,
    staleTime: 0, // Tasks are volatile
  });
}

export function useTask(id: string) {
  const { householdId } = useHousehold();

  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Task;
    },
    enabled: !!id && !!householdId,
  });
}

export function useTasksForToday() {
  const { householdId } = useHousehold();
  const { user } = useAuth();

  useRealtimeInvalidation("tasks", householdId);

  return useQuery({
    queryKey: ["tasks", householdId, "today-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("household_id", householdId!)
        .eq("is_completed", false)
        .lte("due_date", todayISO())
        .order("priority", { ascending: false }) // urgent first
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!householdId,
    staleTime: 0,
  });
}

export function useWeeklyLoad() {
  const { householdId, members } = useHousehold();
  const { start, end } = getWeekRange();

  return useQuery({
    queryKey: ["tasks", householdId, "weekly-load"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("completed_by")
        .eq("household_id", householdId!)
        .eq("is_completed", true)
        .gte("completed_at", start.toISOString())
        .lte("completed_at", end.toISOString());
      if (error) throw error;

      return members.map((m) => ({
        user_id: m.id,
        display_name: m.display_name,
        avatar_emoji: m.avatar_emoji,
        tasks_completed: data.filter((t) => t.completed_by === m.id).length,
      }));
    },
    enabled: !!householdId && members.length > 0,
  });
}

// ---- Mutations ----

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (input.is_recurring && input.frequency) {
        // 1. Create recurrence definition
        const { data: rec, error: recErr } = await supabase
          .from("task_recurrences")
          .insert({
            household_id: householdId!,
            title: input.title,
            priority: input.priority,
            frequency: input.frequency,
            frequency_config: input.frequency_config || {},
            rotate_assignee: input.rotate_assignee || false,
            assigned_to: input.assigned_to,
            next_due_date: input.due_date || todayISO(),
            created_by: user!.id,
          })
          .select()
          .single();
        if (recErr) throw recErr;

        // 2. Create first instance
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            household_id: householdId!,
            recurrence_id: rec.id,
            title: input.title,
            description: input.description || null,
            category: input.category,
            priority: input.priority,
            due_date: input.due_date || todayISO(),
            assigned_to: input.assigned_to,
            created_by: user!.id,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      // Non-recurring task
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          household_id: householdId!,
          title: input.title,
          description: input.description || null,
          category: input.category,
          priority: input.priority,
          due_date: input.due_date,
          assigned_to: input.assigned_to,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", householdId] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          is_completed: true,
          completed_by: user!.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);
      if (error) throw error;
    },
    // Optimistic update: immediately mark as completed in UI
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", householdId] });

      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks", householdId],
      });

      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", householdId] },
        (old) =>
          old?.map((t) =>
            t.id === taskId
              ? { ...t, is_completed: true, completed_by: user!.id, completed_at: new Date().toISOString() }
              : t
          )
      );

      return { previousQueries };
    },
    onError: (_err, _taskId, context) => {
      // Rollback on error
      context?.previousQueries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", householdId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Task>) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", householdId] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", householdId] });
    },
  });
}
