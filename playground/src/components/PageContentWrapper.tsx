"use client";

import { ReactNode } from "react";

interface PageContentWrapperProps {
  children: ReactNode;
}

export default function PageContentWrapper({ children }: PageContentWrapperProps) {
  return (
    <div className="flex flex-col w-4/5 max-w-[1440px] mt-10 overscroll-none">
        {children}
    </div>
  );
}
