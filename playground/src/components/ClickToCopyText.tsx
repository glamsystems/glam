"use client";

import React, { useState } from "react";

import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";

interface Props {
  text: string;
}

export const ClickToCopyText: React.FC<Props> = ({ text }) => {
  const [hasCopied, setHasCopied] = useState(false);
  return (
    <div
      className="w-full justify-between flex flex-row items-center space-x-2 text-sm text-muted-foreground cursor-pointer"
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text || "").then(() => {
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2000);
        });
      }}
    >
      <p className="truncate">{text}</p>
      {hasCopied ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4 cursor-pointer" />
      )}
    </div>
  );
};
