"use client";

import { ReactNode } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { motion, Variants } from "framer-motion";

interface PageContentWrapperProps {
  children: ReactNode;
  header?: ReactNode;
  transition?: boolean;
}

// Define motion variants
const pageVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      ease: "easeInOut",
      duration: 0.42,
    },
  },
};

export default function PageContentWrapper({
  children,
  header,
  transition = false,
}: PageContentWrapperProps) {
  const pathname = usePathname();
  const shouldUseSidebar =
    pathname.startsWith("/vault") ||
    pathname.startsWith("/mint") ||
    pathname.startsWith("/playground");

  // Component to use based on transition prop
  const Component = transition ? motion.div : "div";

  // Motion props to apply when transition is true
  const motionProps = transition
    ? {
        variants: pageVariants,
        initial: "hidden",
        animate: "visible",
      }
    : {};

  if (!shouldUseSidebar) {
    return (
      <Component className="flex flex-col min-h-screen w-full" {...motionProps}>
        {header}
        <div className="flex flex-1 w-full justify-center">
          <div className="w-full max-w-[1440px] pt-[56px] pb-[56px] px-[178px] flex flex-col">
            {children}
          </div>
        </div>
      </Component>
    );
  }

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Component
      className={cn(
        "flex flex-col w-full max-w-[1440px] mt-10 overscroll-none",
        "transition-all duration-200 ease-linear",
        isCollapsed
          ? "pt-[56px] pb-[56px] pl-[178px] pr-[178px]"
          : "pt-[56px] pb-[56px] pl-[178px] pr-[178px]"
      )}
      {...motionProps}
    >
      {children}
    </Component>
  );
}
