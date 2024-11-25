// components/CustomHeader.tsx
"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CustomHeaderProps {
  className?: string;
  children: ReactNode;
}

export default function CustomHeader({
  className,
  children,
}: CustomHeaderProps) {
  return (
    <header className={cn("w-full border-b bg-background", className)}>
      <div className="flex h-14 items-center justify-between max-w-[1440px] mx-auto px-[178px]">
        {children}
      </div>
    </header>
  );
}
