import { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Integration } from "../../app/(vault)/vault/integrations/data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export function IntegrationsList({
  items,
  selected,
  onSelect,
}: {
  items: Integration[];
  selected: number;
  onSelect: (integ: Integration) => void;
}) {
  return (
    <ScrollArea>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            disabled={item.name === "Meteora"}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent min-h-[70px]",
              selected === item.id && "bg-muted",
              item.name === "Meteora" && "opacity-50",
            )}
            onClick={() => onSelect(item)}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.name}</div>
                  {item.enabled && (
                    <span className="flex h-2 w-2 bg-emerald-500" />
                  )}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    selected === item.id
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                ></div>
              </div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.description.substring(0, 300)}
            </div>
            {item.labels.length ? (
              <div className="flex items-center gap-2 mt-auto">
                {item.labels.map((label: string) => (
                  <Badge
                    key={label}
                    variant={getBadgeVariantFromLabel(label)}
                    className="rounded-none"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

function getBadgeVariantFromLabel(
  label: string,
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary";
}
