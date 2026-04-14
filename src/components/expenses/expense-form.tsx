"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";
import { useCreateExpense } from "@/lib/hooks/use-expenses";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { CreateExpenseInput, SplitType } from "@/lib/types";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { user } = useAuth();
  const { currentMember, partner } = useHousehold();
  const createExpense = useCreateExpense();

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "otro",
      paid_by: user?.id ?? "",
      split_type: "equal",
    },
  });

  const onSubmit = (values: CreateExpenseInput) => {
    createExpense.mutate(values, { onSuccess });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Importe (€)</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          placeholder="0,00"
          autoFocus
          {...form.register("amount", { valueAsNumber: true })}
        />
        {form.formState.errors.amount && (
          <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Concepto</Label>
        <Input placeholder="Supermercado, cena, factura..." {...form.register("description")} />
      </div>

      <div className="space-y-1.5">
        <Label>Categoría</Label>
        <Select
          value={form.watch("category")}
          onValueChange={(v) => form.setValue("category", v as CreateExpenseInput["category"])}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Pagado por</Label>
        <div className="flex gap-2">
          {[currentMember, partner].filter(Boolean).map((m) => (
            <button
              key={m!.id}
              type="button"
              onClick={() => form.setValue("paid_by", m!.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors flex-1 justify-center ${
                form.watch("paid_by") === m!.id
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-input text-muted-foreground"
              }`}
            >
              <span>{m!.avatar_emoji}</span>
              <span>{m!.id === user?.id ? "Yo" : m!.display_name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Reparto</Label>
        <Select
          value={form.watch("split_type")}
          onValueChange={(v) => form.setValue("split_type", v as SplitType)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="equal">50/50</SelectItem>
            <SelectItem value="solo_payer">Solo quien paga</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.watch("split_type") === "custom" && (
        <div className="space-y-1.5 animate-slide-up">
          <Label>¿Cuánto debe la otra persona? (€)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            {...form.register("custom_split_amount", { valueAsNumber: true })}
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={createExpense.isPending}>
        {createExpense.isPending ? "Guardando..." : "Registrar gasto"}
      </Button>
    </form>
  );
}
