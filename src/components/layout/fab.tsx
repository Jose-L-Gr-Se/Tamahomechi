"use client";

import { useState } from "react";
import { Plus, CheckSquare, ShoppingCart, Wallet } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { QuickTaskForm } from "@/components/tasks/quick-task-form";
import { QuickShoppingForm } from "@/components/shopping/quick-shopping-form";
import { QuickExpenseForm } from "@/components/expenses/quick-expense-form";

type QuickAction = "task" | "shopping" | "expense" | null;

export function FAB() {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<QuickAction>(null);

  const handleSelect = (a: QuickAction) => {
    setAction(a);
  };

  const handleClose = () => {
    setOpen(false);
    // Delay reset so animation completes
    setTimeout(() => setAction(null), 300);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 right-4 shadow-lg bg-primary text-primary-foreground h-14 w-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: "calc(var(--nav-height) + var(--safe-bottom) + 0.75rem)" }}
        aria-label="Acción rápida"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          {!action ? (
            <>
              <DrawerHeader>
                <DrawerTitle>Añadir rápido</DrawerTitle>
                <DrawerDescription>¿Qué quieres añadir?</DrawerDescription>
              </DrawerHeader>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {([
                  { key: "task" as const, icon: CheckSquare, label: "Tarea", color: "text-tasks bg-tasks/10" },
                  { key: "shopping" as const, icon: ShoppingCart, label: "Compra", color: "text-shopping bg-shopping/10" },
                  { key: "expense" as const, icon: Wallet, label: "Gasto", color: "text-expenses bg-expenses/10" },
                ]).map(({ key, icon: Icon, label, color }) => (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl p-4 transition-colors active:scale-95",
                      color
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : action === "task" ? (
            <>
              <DrawerHeader>
                <DrawerTitle>Nueva tarea</DrawerTitle>
              </DrawerHeader>
              <QuickTaskForm onSuccess={handleClose} />
            </>
          ) : action === "shopping" ? (
            <>
              <DrawerHeader>
                <DrawerTitle>Añadir a la compra</DrawerTitle>
              </DrawerHeader>
              <QuickShoppingForm onSuccess={handleClose} />
            </>
          ) : (
            <>
              <DrawerHeader>
                <DrawerTitle>Registrar gasto</DrawerTitle>
              </DrawerHeader>
              <QuickExpenseForm onSuccess={handleClose} />
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
