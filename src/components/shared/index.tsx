"use client";

import { cn } from "@/lib/utils/cn";
import type { UserProfile } from "@/lib/types";

// ---- Empty State ----
interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ emoji, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <span className="text-4xl mb-3">{emoji}</span>
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---- User Avatar ----
interface UserAvatarProps {
  member: UserProfile | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ member, size = "md", className }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-sm",
    md: "h-8 w-8 text-base",
    lg: "h-10 w-10 text-lg",
  };

  if (!member) {
    return (
      <div className={cn("rounded-full bg-muted flex items-center justify-center", sizeClasses[size], className)}>
        <span className="text-muted-foreground">?</span>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full bg-secondary flex items-center justify-center shrink-0", sizeClasses[size], className)}
      title={member.display_name}
    >
      {member.avatar_emoji}
    </div>
  );
}

// ---- Load Balance Bar ----
interface LoadBalanceBarProps {
  data: { display_name: string; avatar_emoji: string; tasks_completed: number }[];
}

export function LoadBalanceBar({ data }: LoadBalanceBarProps) {
  const total = data.reduce((sum, d) => sum + d.tasks_completed, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Esta semana</p>
      {data.map((entry, i) => {
        const pct = total > 0 ? (entry.tasks_completed / total) * 100 : 50;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm shrink-0">{entry.avatar_emoji}</span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: i === 0 ? "hsl(var(--primary))" : "hsl(var(--agenda))",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-6 text-right">{entry.tasks_completed}</span>
          </div>
        );
      })}
    </div>
  );
}
