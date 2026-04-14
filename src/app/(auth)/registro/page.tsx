"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATAR_EMOJIS } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { z } from "zod";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegistroPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", display_name: "", avatar_emoji: "🙂" },
  });

  const onSubmit = async (values: RegisterValues) => {
    setError(null);

    // Sign up with OTP — profile will be created on onboarding
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding?name=${encodeURIComponent(values.display_name)}&emoji=${encodeURIComponent(values.avatar_emoji)}`,
        data: {
          display_name: values.display_name,
          avatar_emoji: values.avatar_emoji,
        },
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-3 py-8">
        <span className="text-4xl">📬</span>
        <h2 className="text-lg font-semibold">Revisa tu email</h2>
        <p className="text-sm text-muted-foreground">
          Haz clic en el enlace que te hemos enviado para continuar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" placeholder="tu@email.com" autoComplete="email" autoFocus {...form.register("email")} />
        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Tu nombre</Label>
        <Input placeholder="Laura, Carlos..." maxLength={30} {...form.register("display_name")} />
        {form.formState.errors.display_name && <p className="text-xs text-destructive">{form.formState.errors.display_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Tu avatar</Label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => form.setValue("avatar_emoji", emoji)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
                form.watch("avatar_emoji") === emoji
                  ? "border-primary bg-primary/10 scale-110"
                  : "border-transparent bg-secondary"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg">{error}</p>}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
