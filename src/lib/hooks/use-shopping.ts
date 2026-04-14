"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { useRealtimeInvalidation } from "./use-realtime";
import type { ShoppingItem, CreateShoppingItemInput } from "@/lib/types";

const supabase = createClient();

export function useShoppingItems() {
  const { householdId } = useHousehold();

  useRealtimeInvalidation("shopping_items", householdId);

  return useQuery({
    queryKey: ["shopping_items", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("household_id", householdId!)
        .order("is_checked", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShoppingItem[];
    },
    enabled: !!householdId,
    staleTime: 0,
  });
}

export function useShoppingCount() {
  const { householdId } = useHousehold();

  useRealtimeInvalidation("shopping_items", householdId);

  return useQuery({
    queryKey: ["shopping_items", householdId, "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("shopping_items")
        .select("*", { count: "exact", head: true })
        .eq("household_id", householdId!)
        .eq("is_checked", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!householdId,
    staleTime: 0,
  });
}

export function useFrequentProducts() {
  const { householdId } = useHousehold();

  return useQuery({
    queryKey: ["shopping_items", householdId, "frequent"],
    queryFn: async () => {
      // Get recent product names, deduplicate, take top 8
      const { data, error } = await supabase
        .from("shopping_items")
        .select("name, category")
        .eq("household_id", householdId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const seen = new Set<string>();
      const unique: { name: string; category: string }[] = [];
      for (const item of data) {
        const key = item.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
        if (unique.length >= 8) break;
      }
      return unique;
    },
    enabled: !!householdId,
    staleTime: 60_000,
  });
}

export function useAddShoppingItem() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateShoppingItemInput) => {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          household_id: householdId!,
          name: input.name,
          category: input.category,
          added_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_items", householdId] });
    },
  });
}

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase
        .from("shopping_items")
        .update({
          is_checked: checked,
          checked_by: checked ? user!.id : null,
          checked_at: checked ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: ["shopping_items", householdId] });
      const prev = queryClient.getQueryData<ShoppingItem[]>(["shopping_items", householdId]);
      queryClient.setQueryData<ShoppingItem[]>(
        ["shopping_items", householdId],
        (old) => old?.map((i) => (i.id === id ? { ...i, is_checked: checked } : i))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["shopping_items", householdId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_items", householdId] });
    },
  });
}

export function useClearCheckedItems() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("household_id", householdId!)
        .eq("is_checked", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_items", householdId] });
    },
  });
}
