"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, ShoppingCart, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useShoppingCount } from "@/lib/hooks/use-shopping";
import { useTasksForToday } from "@/lib/hooks/use-tasks";
import { useAuth } from "@/providers/auth-provider";

const tabs = [
  { href: "/hoy", label: "Hoy", icon: Home },
  { href: "/tareas", label: "Tareas", icon: CheckSquare },
  { href: "/compra", label: "Compra", icon: ShoppingCart },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/mas", label: "Más", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: todayTasks } = useTasksForToday();
  const { data: shoppingCount } = useShoppingCount();

  const myTodayCount = todayTasks?.filter((t) => t.assigned_to === user?.id && !t.is_completed).length ?? 0;

  function getBadge(href: string): number | null {
    if (href === "/tareas" && myTodayCount > 0) return myTodayCount;
    if (href === "/compra" && shoppingCount && shoppingCount > 0) return shoppingCount;
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        className="flex items-center justify-around h-16"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const badge = getBadge(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
