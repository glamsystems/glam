"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const BetaWarning = () => {
  const { state } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === "collapsed";

  // Determine the disclaimer path based on current route
  const disclaimerPath = pathname.startsWith("/vault")
    ? "/vault/disclaimer"
    : pathname.startsWith("/mint")
    ? "/mint/disclaimer"
    : "/disclaimer";

  return (
    <motion.div
      className={cn(
        "border-t fixed w-full bottom-0 h-[48px] z-30 flex flex-row items-center justify-center bg-sidebar select-none sm:opacity-0 lg:opacity-100 pr-4",
        isCollapsed ? "pl-12" : "pl-[264px]",
        "transition-all duration-200 ease-linear" // Add smooth transition
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.42 }}
    >
      <div className="flex flex-row items-center justify-center w-full text-sm text-destructive">
        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
        <p className="font-medium mr-2 text-nowrap">Unaudited Beta</p>
        <p className="leading-5 text-center text-muted-foreground truncate text-nowrap">
          Active development; breaking changes. Use at your own risk. No
          guarantees. GLAM not liable for any losses. Not investment advice.{" "}
        </p>
        &nbsp;
        <p className="leading-5 text-center text-muted-foreground text-nowrap">
          <Link
            href={disclaimerPath}
            className="underline hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
          >
            See full disclaimer
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};

export default BetaWarning;
