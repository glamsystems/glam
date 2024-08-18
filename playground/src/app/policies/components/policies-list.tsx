import { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { Policies } from "../data"
import { usePolicies } from "../use-policy"
import {Badge} from "../../../components/ui/badge";
import {ScrollArea} from "../../../components/ui/scroll-area";

interface PoliciesListProps {
  items: Policies[]
}

export function PoliciesList({ items }: PoliciesListProps) {
  const [poilcies, setPolicies] = usePolicies()

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent min-h-[70px]",
              poilcies.selected === item.id && "bg-muted"
            )}
            onClick={() =>
              setPolicies({
                ...poilcies,
                selected: item.id,
              })
            }
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.name}</div>
                  {item.active && (
                    <span className="flex h-2 w-2 bg-emerald-500" />
                  )}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    poilcies.selected === item.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                </div>
              </div>
              {/*<div className="text-xs font-medium">{item.subject}</div>*/}
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.description.substring(0, 300)}
            </div>
            {item.labels.length ? (
              <div className="flex items-center gap-2">
                {item.labels.map((label) => (
                  <Badge key={label} variant={getBadgeVariantFromLabel(label)} className="rounded-none">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default"
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}
