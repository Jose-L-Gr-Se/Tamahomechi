import { cn } from "@/lib/utils/cn";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Add extra bottom padding for FAB */
  withFab?: boolean;
}

export function PageShell({ children, className, withFab }: PageShellProps) {
  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto px-4 pt-4 pb-safe-nav scrollbar-hide",
        withFab && "pb-[calc(var(--nav-height)+var(--safe-bottom)+4rem)]",
        className
      )}
    >
      {children}
    </main>
  );
}
