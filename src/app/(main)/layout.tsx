"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/providers/auth-provider";
import { useHousehold } from "@/providers/household-provider";
import { usePWARegister } from "@/lib/hooks/use-pwa";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { hasHousehold, isLoading: householdLoading } = useHousehold();
  const router = useRouter();

  usePWARegister();

  useEffect(() => {
    if (authLoading || householdLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Solo redirigir si el profile cargó completamente y no tiene hogar
    if (!hasHousehold) {
      router.replace("/onboarding");
    }
  }, [user, hasHousehold, authLoading, householdLoading, router]);

  if (authLoading || householdLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-2 animate-pulse">
          <span className="text-3xl">🏠</span>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasHousehold) return null;

  return (
    <div className="min-h-dvh flex flex-col">
      {children}
      <BottomNav />
    </div>
  );
}
