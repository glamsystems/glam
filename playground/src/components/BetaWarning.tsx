"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import React from "react";
import Link from "next/link";

const BetaWarning = () => {
  return (
    <div className="fixed w-full pl-[260px] bottom-0 h-[56px] z-30 flex flex-row items-center justify-center bg-zinc-100 dark:bg-zinc-900 select-none sm:opacity-0 lg:opacity-100 pr-4">
      <div className="flex flex-row items-center justify-center w-full text-sm text-destructive">
        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
        <p className="font-medium mr-2 text-nowrap">Unaudited Beta</p>
        <p className="leading-5 text-center text-muted-foreground truncate text-nowrap">
          Active development; breaking changes. Use at your own risk. Possible losses. No guarantees. GLAM not liable for any losses.{" "}
        </p>
        &nbsp;
        <p className="leading-5 text-center text-muted-foreground text-nowrap">
          <Link href="/disclaimer" className="underline hover:text-destructive transition-colors">
            See full disclaimer
          </Link>
          .
        </p>
      </div>
    </div>);
};

export default BetaWarning;
