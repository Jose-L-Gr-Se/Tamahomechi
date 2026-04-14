"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { useHousehold } from "@/providers/household-provider";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, Copy, Check, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AjustesPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { household, currentMember, partner } = useHousehold();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(currentMember?.display_name ?? "");
  const [avatarEmoji, setAvatarEmoji] = useState(currentMember?.avatar_emoji ?? "🙂");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    await supabase
      .from("user_profiles")
      .update({ display_name: displayName.trim(), avatar_emoji: avatarEmoji })
      .eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["members"] });
    setSaving(false);
  };

  const handleCopyCode = async () => {
    if (!household?.invite_code) return;
    try {
      await navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      const el = document.createElement("textarea");
      el.value = household.invite_code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    if (!household?.invite_code) return;
    if (navigator.share) {
      await navigator.share({
        title: "Únete a nuestro hogar",
        text: `Usa este código para unirte a "${household.name}" en Hogar: ${household.invite_code}`,
      });
    } else {
      handleCopyCode();
    }
  };

  return (
    <>
      <TopBar title="Ajustes" showAvatar={false} />
      <PageShell>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <div className="space-y-8">
          {/* Profile section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tu perfil</h3>

            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30} />
            </div>

            <div className="space-y-1.5">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
                      avatarEmoji === emoji ? "border-primary bg-primary/10 scale-110" : "border-transparent bg-secondary"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Guardar perfil"}
            </Button>
          </section>

          {/* Household section */}
          <section className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hogar</h3>

            <div className="bg-card rounded-xl p-4 border space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Nombre del hogar</p>
                <p className="text-sm font-medium">{household?.name}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Miembros</p>
                <div className="flex items-center gap-2 mt-1">
                  <span>{currentMember?.avatar_emoji} {currentMember?.display_name}</span>
                  {partner && <span className="text-muted-foreground">·</span>}
                  {partner && <span>{partner.avatar_emoji} {partner.display_name}</span>}
                  {!partner && <span className="text-muted-foreground text-sm">(esperando al segundo miembro)</span>}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Código de invitación</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-center text-lg font-mono tracking-widest bg-muted px-3 py-2 rounded-lg">
                    {household?.invite_code}
                  </code>
                  <Button size="icon" variant="outline" onClick={handleCopyCode}>
                    {copied ? <Check className="h-4 w-4 text-shopping" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="secondary" className="w-full mt-2" onClick={handleShareCode}>
                  Compartir código
                </Button>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <section className="border-t pt-6">
            <Button variant="outline" className="w-full text-destructive" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </section>

          <p className="text-xs text-muted-foreground text-center pb-4">
            Hogar v1.0 · Hecho con cariño 🏠
          </p>
        </div>
      </PageShell>
    </>
  );
}
