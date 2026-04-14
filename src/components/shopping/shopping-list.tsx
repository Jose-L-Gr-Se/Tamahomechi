"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useShoppingItems, useAddShoppingItem, useToggleShoppingItem, useClearCheckedItems, useFrequentProducts } from "@/lib/hooks/use-shopping";
import { SHOPPING_CATEGORIES } from "@/lib/constants";
import { EmptyState } from "@/components/shared";
import { Trash2 } from "lucide-react";
import type { ShoppingItem, ShoppingCategory } from "@/lib/types";

export function ShoppingList() {
  const [newItem, setNewItem] = useState("");
  const { data: items = [], isLoading } = useShoppingItems();
  const { data: frequent = [] } = useFrequentProducts();
  const addItem = useAddShoppingItem();
  const toggleItem = useToggleShoppingItem();
  const clearChecked = useClearCheckedItems();

  const pending = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  // Group pending by category
  const grouped = SHOPPING_CATEGORIES.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const catItems = pending.filter((i) => i.category === cat.value);
    if (catItems.length > 0) acc[cat.value] = catItems;
    return acc;
  }, {});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    addItem.mutate({ name: newItem.trim(), category: "general" }, {
      onSuccess: () => setNewItem(""),
    });
  };

  const handleQuickAdd = (name: string, category: string) => {
    addItem.mutate({ name, category: category as ShoppingCategory });
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-3 py-4">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Always-visible input */}
      <form onSubmit={handleAdd} className="flex gap-2 sticky top-0 z-10 bg-background pb-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Añadir producto..."
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!newItem.trim() || addItem.isPending}>
          Añadir
        </Button>
      </form>

      {/* Frequent products pills */}
      {frequent.length > 0 && pending.length === 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Añadir rápido</p>
          <div className="flex flex-wrap gap-2">
            {frequent.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickAdd(p.name, p.category)}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm active:scale-95 transition-transform"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending items by category */}
      {Object.keys(grouped).length === 0 && checked.length === 0 ? (
        <EmptyState emoji="🛒" title="Lista vacía" description="Añade productos arriba o usa los frecuentes" />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catInfo = SHOPPING_CATEGORIES.find((c) => c.value === cat);
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {catInfo?.emoji} {catInfo?.label}
                </p>
                <div className="space-y-1">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card"
                    >
                      <Checkbox
                        checked={item.is_checked}
                        onCheckedChange={(checked) =>
                          toggleItem.mutate({ id: item.id, checked: !!checked })
                        }
                      />
                      <span className="text-sm flex-1">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checked items (collapsible) */}
      {checked.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comprados ({checked.length})
            </p>
            <button
              onClick={() => clearChecked.mutate()}
              className="flex items-center gap-1 text-xs text-destructive hover:underline"
              disabled={clearChecked.isPending}
            >
              <Trash2 className="h-3 w-3" />
              Limpiar
            </button>
          </div>
          <div className="space-y-1 opacity-50">
            {checked.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl">
                <Checkbox
                  checked
                  onCheckedChange={() => toggleItem.mutate({ id: item.id, checked: false })}
                />
                <span className="text-sm line-through">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
