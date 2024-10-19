"use client";

import { ReactNode } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface PageContentWrapperProps {
  children: ReactNode;
}

export default function PageContentWrapper({
  children,
}: PageContentWrapperProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-[1440px] mt-10 overscroll-none",
        "transition-all duration-200 ease-linear", // Add smooth transition
        isCollapsed
          ? "pt-[56px] pb-[56px] pl-[178px] pr-[178px]"
          : "pt-[56px] pb-[56px] pl-[178px] pr-[178px]"
      )}
    >
      {children}
    </div>
  );
}
