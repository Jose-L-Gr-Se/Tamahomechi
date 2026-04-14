"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import type { Household, UserProfile } from "@/lib/types";

interface HouseholdContextValue {
  household: Household | null;
  members: UserProfile[];
  currentMember: UserProfile | null;
  partner: UserProfile | null;
  householdId: string | null;
  isLoading: boolean;
  hasHousehold: boolean;
}

const HouseholdContext = createContext<HouseholdContextValue>({
  household: null,
  members: [],
  currentMember: null,
  partner: null,
  householdId: null,
  isLoading: true,
  hasHousehold: false,
});

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });

  const householdId = profile?.household_id ?? null;

  const { data: household, isLoading: householdLoading } = useQuery({
    queryKey: ["household", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .eq("id", householdId!)
        .single();
      if (error) throw error;
      return data as Household;
    },
    enabled: !!householdId,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["members", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("household_id", householdId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: !!householdId,
  });

  const currentMember = members.find((m) => m.id === user?.id) ?? null;
  const partner = members.find((m) => m.id !== user?.id) ?? null;
  const isLoading = profileLoading || (!!householdId && (householdLoading || membersLoading));

  return (
    <HouseholdContext.Provider
      value={{
        household: household ?? null,
        members,
        currentMember,
        partner,
        householdId,
        isLoading,
        hasHousehold: !!householdId,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold must be used within HouseholdProvider");
  return ctx;
}
