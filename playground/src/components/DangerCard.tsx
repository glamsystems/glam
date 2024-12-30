"use client";

import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

interface Props {
  message: string;
  className?: string;
}

export const DangerCard: React.FC<Props> = ({ message, className }) => (
  <Card
    className={cn("border border-destructive/20 bg-destructive/5 p-4", className)}
  >
    <div className="flex">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  </Card>
);
