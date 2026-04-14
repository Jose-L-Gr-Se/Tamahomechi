"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: `${window.location.origin}/hoy`,
      },
    });

    if (error) {
      setError(error.message);
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
          Te hemos enviado un enlace mágico para iniciar sesión.
        </p>
        <Button variant="ghost" onClick={() => setSent(false)}>
          Volver a intentar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          autoFocus
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Enviando..." : "Enviar enlace mágico"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Primera vez?{" "}
        <Link href="/registro" className="text-primary font-medium hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
