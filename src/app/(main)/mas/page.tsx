"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { Wallet, Settings } from "lucide-react";

const sections = [
  { href: "/mas/gastos", label: "Gastos", emoji: "💰", description: "Balance y gastos compartidos" },
  { href: "/mas/ajustes", label: "Ajustes", emoji: "⚙️", description: "Perfil y configuración" },
];

export default function MasPage() {
  return (
    <>
      <TopBar title="Más" />
      <PageShell>
        <div className="grid grid-cols-1 gap-3">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card border active:bg-accent transition-colors">
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 border-t pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Gatos, Mantenimiento, Wiki y Estadísticas llegarán pronto.
          </p>
        </div>
      </PageShell>
    </>
  );
}
