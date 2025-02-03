"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ComponentDebugWrapperProps {
  children: ReactNode;
  header?: string | ReactNode;
}

export default function ComponentDebugWrapper({
  children,
  header,
}: ComponentDebugWrapperProps) {
  return (
    <div className={cn("flex flex-col w-full border p-4 border-orange-500")}>
      {header && (
        <div className="mb-2 font-medium text-orange-600">{header}</div>
      )}
      {children}
    </div>
  );
}
