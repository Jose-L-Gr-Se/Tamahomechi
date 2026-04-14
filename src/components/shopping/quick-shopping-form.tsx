"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAddShoppingItem, useFrequentProducts } from "@/lib/hooks/use-shopping";
import type { ShoppingCategory } from "@/lib/types";

export function QuickShoppingForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const addItem = useAddShoppingItem();
  const { data: frequent = [] } = useFrequentProducts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addItem.mutate({ name: name.trim(), category: "general" }, {
      onSuccess: () => { setName(""); onSuccess(); },
    });
  };

  const handleQuickAdd = (productName: string, category: ShoppingCategory) => {
    addItem.mutate({ name: productName, category }, { onSuccess });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          autoFocus
          className="flex-1"
        />
        <Button type="submit" disabled={!name.trim() || addItem.isPending}>
          Añadir
        </Button>
      </form>

      {frequent.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Productos frecuentes</p>
          <div className="flex flex-wrap gap-2">
            {frequent.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickAdd(p.name, p.category as ShoppingCategory)}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors active:scale-95"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
