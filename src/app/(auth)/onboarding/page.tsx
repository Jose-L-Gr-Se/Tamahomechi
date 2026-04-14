"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createHouseholdSchema, joinHouseholdSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { z } from "zod";

type CreateValues = z.infer<typeof createHouseholdSchema>;
type JoinValues = z.infer<typeof joinHouseholdSchema>;

function OnboardingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayName = params.get("name") || user?.user_metadata?.display_name || "Usuario";
  const avatarEmoji = params.get("emoji") || user?.user_metadata?.avatar_emoji || "🙂";

  // Ensure profile exists
  useEffect(() => {
    if (!user) return;
    const ensureProfile = async () => {
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (existing) {
        // Profile exists, check if already has household
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("household_id")
          .eq("id", user.id)
          .single();
        if (profile?.household_id) {
          router.replace("/hoy");
        }
        return;
      }

      // Create profile without household
      await supabase.from("user_profiles").insert({
        id: user.id,
        display_name: displayName,
        avatar_emoji: avatarEmoji,
      });
    };
    ensureProfile();
  }, [user, supabase, displayName, avatarEmoji, router]);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createHouseholdSchema),
    defaultValues: { name: "Nuestro hogar" },
  });

  const joinForm = useForm<JoinValues>({
    resolver: zodResolver(joinHouseholdSchema),
    defaultValues: { invite_code: "" },
  });

  const handleCreate = async (values: CreateValues) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // Create household
    const { data: household, error: hErr } = await supabase
      .from("households")
      .insert({ name: values.name })
      .select()
      .single();

    if (hErr) { setError(hErr.message); setLoading(false); return; }

    // Link profile to household
    const { error: pErr } = await supabase
      .from("user_profiles")
      .update({ household_id: household.id })
      .eq("id", user.id);

    if (pErr) { setError(pErr.message); setLoading(false); return; }

    router.replace("/hoy");
  };

  const handleJoin = async (values: JoinValues) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // Find household by invite code
    const { data: household, error: hErr } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", values.invite_code)
      .single();

    if (hErr || !household) {
      setError("Código no válido. Comprueba y vuelve a intentarlo.");
      setLoading(false);
      return;
    }

    // Check member count
    const { count } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("household_id", household.id);

    if ((count ?? 0) >= 2) {
      setError("Este hogar ya está completo (máximo 2 personas).");
      setLoading(false);
      return;
    }

    // Link profile to household
    const { error: pErr } = await supabase
      .from("user_profiles")
      .update({ household_id: household.id })
      .eq("id", user.id);

    if (pErr) {
      setError(pErr.message);
      setLoading(false);
      return;
    }

    router.replace("/hoy");
  };

  if (mode === "choose") {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center">
          <span className="text-3xl">{avatarEmoji}</span>
          <h2 className="text-lg font-semibold mt-2">¡Hola, {displayName}!</h2>
          <p className="text-sm text-muted-foreground mt-1">¿Qué quieres hacer?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setMode("create")}
            className="w-full p-4 rounded-xl border bg-card text-left hover:bg-accent transition-colors"
          >
            <p className="font-medium">🏠 Crear un nuevo hogar</p>
            <p className="text-xs text-muted-foreground mt-1">Soy la primera persona en configurar la app</p>
          </button>

          <button
            onClick={() => setMode("join")}
            className="w-full p-4 rounded-xl border bg-card text-left hover:bg-accent transition-colors"
          >
            <p className="font-medium">🔑 Unirme a un hogar</p>
            <p className="text-xs text-muted-foreground mt-1">Mi pareja ya creó el hogar y me pasó un código</p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
        <button type="button" onClick={() => setMode("choose")} className="text-sm text-muted-foreground hover:underline">← Volver</button>
        <h2 className="text-lg font-semibold">Crear hogar</h2>
        <div className="space-y-1.5">
          <Label>Nombre del hogar</Label>
          <Input placeholder="Nuestro hogar" {...createForm.register("name")} />
        </div>
        {error && <p className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear hogar"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={joinForm.handleSubmit(handleJoin)} className="space-y-4 py-4">
      <button type="button" onClick={() => setMode("choose")} className="text-sm text-muted-foreground hover:underline">← Volver</button>
      <h2 className="text-lg font-semibold">Unirse a un hogar</h2>
      <div className="space-y-1.5">
        <Label>Código de invitación</Label>
        <Input
          placeholder="Ej: Xk7pQ2mN"
          maxLength={8}
          className="text-center text-lg tracking-widest font-mono"
          {...joinForm.register("invite_code")}
        />
        {joinForm.formState.errors.invite_code && (
          <p className="text-xs text-destructive">{joinForm.formState.errors.invite_code.message}</p>
        )}
      </div>
      {error && <p className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Uniéndome..." : "Unirme al hogar"}
      </Button>
    </form>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
