"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import React from "react";
import Link from "next/link";

const BetaWarning = () => {
  return (
    <div className="fixed w-full pl-[244px] bottom-0 h-[56px] z-40 flex flex-row items-center justify-center bg-muted select-none">
      <div className="flex flex-row items-center justify-center w-full text-sm text-destructive">
        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
        <p className="font-medium mr-2">Unaudited Beta</p>
        <p className="leading-5 text-center text-muted-foreground">
          Active development; breaking changes. Use at your own risk. Possible losses. No guarantees. GLAM not liable for any losses.{" "}
          <Link href="/disclaimer" className="underline hover:text-destructive transition-colors">
            See full disclaimer
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default BetaWarning;
