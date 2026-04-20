"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";

const supabase = createClient();

export interface ChoreZone {
  id: string;
  household_id: string;
  name: string;
  emoji: string;
  is_active: boolean;
  is_fixed: boolean;
  rotation_slot: number | null;
  sort_order: number;
  created_at: string;
}

export interface ChoreDefinition {
  id: string;
  zone_id: string;
  household_id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export interface ChoreWeek {
  id: string;
  household_id: string;
  week_start: string;
  week_end: string;
  generated_at: string;
}

export interface ChoreAssignment {
  id: string;
  household_id: string;
  week_id: string;
  zone_id: string;
  assigned_to: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  penalty_applied: boolean;
  penalty_amount: number;
  penalty_expense_id: string | null;
  created_at: string;
  // Joined
  zone?: ChoreZone;
}

// ---- Current week assignments ----
export function useCurrentChoreWeek() {
  const { householdId } = useHousehold();

  return useQuery({
    queryKey: ["chore_week_current", householdId],
    queryFn: async () => {
      // Get the most recent week
      const { data: week, error: weekError } = await supabase
        .from("chore_weeks")
        .select("*")
        .eq("household_id", householdId!)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      if (weekError) return null;
      return week as ChoreWeek;
    },
    enabled: !!householdId,
    staleTime: 0,
  });
}

export function useChoreAssignments(weekId: string | null) {
  const { householdId } = useHousehold();

  return useQuery({
    queryKey: ["chore_assignments", weekId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chore_assignments")
        .select(`
          *,
          zone:chore_zones(*)
        `)
        .eq("week_id", weekId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChoreAssignment[];
    },
    enabled: !!weekId && !!householdId,
    staleTime: 0,
  });
}

export function useMyChoreAssignments(weekId: string | null) {
  const { user } = useAuth();
  const { householdId } = useHousehold();

  return useQuery({
    queryKey: ["chore_assignments_mine", weekId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chore_assignments")
        .select(`*, zone:chore_zones(*)`)
        .eq("week_id", weekId!)
        .eq("assigned_to", user!.id)
        .order("is_completed", { ascending: true });

      if (error) throw error;
      return data as ChoreAssignment[];
    },
    enabled: !!weekId && !!user?.id && !!householdId,
    staleTime: 0,
  });
}

// ---- Zones ----
export function useChoreZones() {
  const { householdId } = useHousehold();

  return useQuery({
    queryKey: ["chore_zones", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chore_zones")
        .select("*")
        .eq("household_id", householdId!)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ChoreZone[];
    },
    enabled: !!householdId,
  });
}

export function useChoreDefinitions(zoneId: string | null) {
  return useQuery({
    queryKey: ["chore_definitions", zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chore_definitions")
        .select("*")
        .eq("zone_id", zoneId!)
        .eq("is_active", true);

      if (error) throw error;
      return data as ChoreDefinition[];
    },
    enabled: !!zoneId,
  });
}

// ---- Mutations ----
export function useCompleteChore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.rpc("complete_chore", {
        p_assignment_id: assignmentId,
        p_completed_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chore_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["chore_assignments_mine"] });
      queryClient.invalidateQueries({ queryKey: ["chore_week_current"] });
    },
  });
}

export function useUncompleteChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("chore_assignments")
        .update({ is_completed: false, completed_at: null, completed_by: null })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chore_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["chore_assignments_mine"] });
    },
  });
}

export function useReassignChore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ assignmentId, newUserId }: { assignmentId: string; newUserId: string }) => {
      const { error } = await supabase
        .from("chore_assignments")
        .update({
          assigned_to: newUserId,
          overridden_by: user!.id,
          overridden_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chore_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["chore_assignments_mine"] });
    },
  });
}

export function useGenerateChoreWeek() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (weekStart?: string) => {
      const { data, error } = await supabase.rpc("generate_chore_week", {
        p_household_id: householdId!,
        p_week_start: weekStart ?? null,
        p_generated_by: user!.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chore_week_current", householdId] });
      queryClient.invalidateQueries({ queryKey: ["chore_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["chore_assignments_mine"] });
    },
  });
}

export function useRegenerateChoreWeek() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (weekStart?: string) => {
      if (!householdId || !user) {
        throw new Error("Household or user not found");
      }

      // Look up the current week_start so the RPC regenerates the same slot.
      const { data: currentWeek } = await supabase
        .from("chore_weeks")
        .select("week_start")
        .eq("household_id", householdId)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      const weekStartToUse = currentWeek?.week_start ?? weekStart ?? null;

      // Passing a non-null exclude map (even empty) signals the RPC to
      // delete the existing week and regenerate. The RPC runs as
      // SECURITY DEFINER, so it bypasses RLS that would otherwise block
      // client-side deletes silently.
      const { data, error } = await supabase.rpc("generate_chore_week", {
        p_household_id: householdId,
        p_week_start: weekStartToUse,
        p_generated_by: user.id,
        p_exclude_assignments: {},
      });
      
      if (error) {
        console.error("Error generating chore week:", error);
        throw error;
      }
      
      console.log("New chore week generated:", data);
      return data;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["chore_week_current"] });
      queryClient.invalidateQueries({ queryKey: ["chore_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["chore_assignments_mine"] });
      queryClient.invalidateQueries({ queryKey: ["chore_zones"] });
    },
    onError: (error) => {
      console.error("Chore regeneration failed:", error);
    },
  });
}

export function useUpdateChoreWeekEnd() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async ({ weekId, newWeekEnd }: { weekId: string; newWeekEnd: string }) => {
      const { error } = await supabase
        .from("chore_weeks")
        .update({ week_end: newWeekEnd })
        .eq("id", weekId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chore_week_current", householdId] });
    },
  });
}

export function useApplyPenalties() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("apply_chore_penalties", {
        p_household_id: householdId!,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chore_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["balance", householdId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
    },
  });
}

export function useUpdateChoreConfig() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async ({ rotatingPerMember }: { rotatingPerMember: number }) => {
      if (!householdId) throw new Error("Household not found");
      const { error } = await supabase
        .from("households")
        .update({ chore_rotating_per_member: rotatingPerMember })
        .eq("id", householdId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household", householdId] });
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ChoreZone>) => {
      const { error } = await supabase
        .from("chore_zones")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chore_zones", householdId] });
    },
  });
}

export function useAddChoreDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ zoneId, householdId, title }: { zoneId: string; householdId: string; title: string }) => {
      const { error } = await supabase
        .from("chore_definitions")
        .insert({ zone_id: zoneId, household_id: householdId, title });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chore_definitions", vars.zoneId] });
    },
  });
}

export function useDeleteChoreDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, zoneId }: { id: string; zoneId: string }) => {
      const { error } = await supabase
        .from("chore_definitions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chore_definitions", vars.zoneId] });
    },
  });
}
