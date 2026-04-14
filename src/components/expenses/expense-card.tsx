"use client";

import { cn } from "@/lib/utils/cn";
import { UserAvatar } from "@/components/shared";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { formatEUR, formatBalance } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { Expense, BalanceEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ---- Balance Summary ----
interface BalanceSummaryProps {
  balance: BalanceEntry[];
  onSettle?: () => void;
  compact?: boolean;
}

export function BalanceSummary({ balance, onSettle, compact }: BalanceSummaryProps) {
  const { user } = useAuth();
  const myBalance = balance.find((b) => b.user_id === user?.id);
  const amount = myBalance?.net_balance ?? 0;
  const isEven = Math.abs(amount) < 0.01;

  return (
    <div className={cn("rounded-xl bg-card p-4", !compact && "border")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Balance</p>
          <p className={cn(
            "text-lg font-semibold mt-0.5",
            isEven ? "text-foreground" : amount > 0 ? "text-shopping" : "text-urgent"
          )}>
            {formatBalance(amount)}
          </p>
        </div>
        {!compact && !isEven && onSettle && (
          <button
            onClick={onSettle}
            className="text-sm font-medium text-primary hover:underline"
          >
            Saldar
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Expense Card ----
interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const { members } = useHousehold();
  const payer = members.find((m) => m.id === expense.paid_by);
  const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);

  const splitLabel =
    expense.split_type === "equal" ? "50/50" :
    expense.split_type === "solo_payer" ? "Solo pagador" : "Personalizado";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-expenses/10 text-lg shrink-0">
        {categoryInfo?.emoji ?? "💳"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{expense.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(parseISO(expense.created_at), "d MMM", { locale: es })} · {splitLabel}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{formatEUR(expense.amount)}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <UserAvatar member={payer} size="sm" />
        </div>
      </div>
    </div>
  );
}
