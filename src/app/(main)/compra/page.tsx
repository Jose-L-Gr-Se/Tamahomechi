"use client";

import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { ShoppingList } from "@/components/shopping/shopping-list";

export default function CompraPage() {
  return (
    <>
      <TopBar title="Lista de compra" />
      <PageShell>
        <ShoppingList />
      </PageShell>
    </>
  );
}
