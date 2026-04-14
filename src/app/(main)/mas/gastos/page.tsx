"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { BalanceSummary, ExpenseCard } from "@/components/expenses/expense-card";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useExpenses, useBalance, useSettleDebt } from "@/lib/hooks/use-expenses";
import { useAuth } from "@/providers/auth-provider";
import { useHousehold } from "@/providers/household-provider";
import { formatEUR } from "@/lib/utils/currency";
import { Plus, ArrowLeft } from "lucide-react";

export default function GastosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { partner } = useHousehold();
  const [showAdd, setShowAdd] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: balance = [] } = useBalance();
  const settleDebt = useSettleDebt();

  const myBalance = balance.find((b) => b.user_id === user?.id);
  const amount = myBalance?.net_balance ?? 0;

  const handleSettle = () => {
    if (!user || !partner || Math.abs(amount) < 0.01) return;

    const settleAmount = Math.abs(amount);
    const paidBy = amount > 0 ? partner.id : user.id;
    const paidTo = amount > 0 ? user.id : partner.id;

    settleDebt.mutate(
      { amount: settleAmount, paid_by: paidBy, paid_to: paidTo },
      { onSuccess: () => setShowSettle(false) }
    );
  };

  return (
    <>
      <TopBar
        title="Gastos"
        showAvatar={false}
        rightAction={
          <Button size="icon" variant="ghost" onClick={() => setShowAdd(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />
      <PageShell>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        {/* Balance */}
        {balance.length > 0 && (
          <div className="mb-6">
            <BalanceSummary
              balance={balance}
              onSettle={() => setShowSettle(true)}
            />
          </div>
        )}

        {/* Expense list */}
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : expenses.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Este mes</h3>
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="💰"
            title="Sin gastos registrados"
            description="Registra el primer gasto compartido"
          />
        )}
      </PageShell>

      {/* Add expense drawer */}
      <Drawer open={showAdd} onOpenChange={setShowAdd}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Nuevo gasto</DrawerTitle></DrawerHeader>
          <ExpenseForm onSuccess={() => setShowAdd(false)} />
        </DrawerContent>
      </Drawer>

      {/* Settle drawer */}
      <Drawer open={showSettle} onOpenChange={setShowSettle}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Saldar deuda</DrawerTitle>
            <DrawerDescription>
              {amount > 0
                ? `${partner?.display_name} te debe ${formatEUR(Math.abs(amount))}`
                : `Debes ${formatEUR(Math.abs(amount))} a ${partner?.display_name}`
              }
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Al saldar, se registrará un pago de {formatEUR(Math.abs(amount))} y el balance volverá a cero.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSettle(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSettle} disabled={settleDebt.isPending}>
                {settleDebt.isPending ? "Saldando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
