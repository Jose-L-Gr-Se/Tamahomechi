"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateExpense } from "@/lib/hooks/use-expenses";
import { useHousehold } from "@/providers/household-provider";
import { useAuth } from "@/providers/auth-provider";

const quickExpenseSchema = z.object({
  amount: z.string().min(1, "Importe obligatorio"),
  description: z.string().min(1, "Concepto obligatorio"),
});

type QuickExpenseValues = z.infer<typeof quickExpenseSchema>;

export function QuickExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { currentMember, partner } = useHousehold();
  const createExpense = useCreateExpense();

  const form = useForm<QuickExpenseValues>({
    resolver: zodResolver(quickExpenseSchema),
    defaultValues: { amount: "", description: "" },
  });

  const onSubmit = (values: QuickExpenseValues) => {
    const amount = parseFloat(values.amount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;

    createExpense.mutate(
      {
        amount,
        description: values.description,
        category: "otro",
        paid_by: user!.id,
        split_type: "equal",
      },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Importe (€)</Label>
        <Input
          placeholder="0,00"
          inputMode="decimal"
          autoFocus
          {...form.register("amount")}
        />
        {form.formState.errors.amount && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Concepto</Label>
        <Input
          placeholder="¿En qué se ha gastado?"
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Pagado por {currentMember?.display_name ?? "ti"} · Reparto 50/50
      </p>

      <Button type="submit" className="w-full" disabled={createExpense.isPending}>
        {createExpense.isPending ? "Guardando..." : "Registrar gasto"}
      </Button>
    </form>
  );
}
