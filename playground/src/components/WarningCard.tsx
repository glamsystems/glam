"use client";

import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

interface Props {
  message: string;
  className?: string;
}

export const WarningCard: React.FC<Props> = ({ message, className }) => (
  <Card
    className={cn("border border-orange-500/20 bg-orange-500/5 p-4", className)}
  >
    <div className="flex">
      <p className="text-sm text-orange-400">{message}</p>
    </div>
  </Card>
);
