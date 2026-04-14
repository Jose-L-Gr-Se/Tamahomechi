"use client";

import { useHousehold } from "@/providers/household-provider";

interface TopBarProps {
  title: string;
  showAvatar?: boolean;
  rightAction?: React.ReactNode;
}

export function TopBar({ title, showAvatar = true, rightAction }: TopBarProps) {
  const { currentMember } = useHousehold();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-lg font-semibold font-display tracking-tight truncate">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {rightAction}
          {showAvatar && currentMember && (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-base">
              {currentMember.avatar_emoji}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
