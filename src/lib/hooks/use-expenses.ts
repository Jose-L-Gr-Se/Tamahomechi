"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import type { Expense, BalanceEntry, CreateExpenseInput } from "@/lib/types";

const supabase = createClient();

export function useExpenses(monthOffset: number = 0) {
  const { householdId } = useHousehold();

  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const startDate = targetMonth.toISOString();
  const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();

  return useQuery({
    queryKey: ["expenses", householdId, monthOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("household_id", householdId!)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!householdId,
    // Expenses use refetch on focus, not realtime
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
}

export function useBalance() {
  const { householdId } = useHousehold();

  return useQuery({
    queryKey: ["balance", householdId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_household_balance", {
        p_household_id: householdId!,
      });
      if (error) throw error;
      return data as BalanceEntry[];
    },
    enabled: !!householdId,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          household_id: householdId!,
          amount: input.amount,
          description: input.description,
          category: input.category,
          paid_by: input.paid_by,
          split_type: input.split_type,
          custom_split_amount: input.split_type === "custom" ? input.custom_split_amount : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
      queryClient.invalidateQueries({ queryKey: ["balance", householdId] });
    },
  });
}

export function useSettleDebt() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (input: { amount: number; paid_by: string; paid_to: string; note?: string }) => {
      const { data, error } = await supabase
        .from("expense_settlements")
        .insert({
          household_id: householdId!,
          amount: input.amount,
          paid_by: input.paid_by,
          paid_to: input.paid_to,
          note: input.note || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance", householdId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
      queryClient.invalidateQueries({ queryKey: ["balance", householdId] });
    },
  });
}
