import { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { ShareClasses } from "../data"
import { useShareClasses } from "../use-shareClass"
import {Badge} from "../../../components/ui/badge";
import {ScrollArea} from "../../../components/ui/scroll-area";

interface ShareClassesListProps {
  items: ShareClasses[]
}

export function ShareClassesList({ items }: ShareClassesListProps) {
  const [shareClasses, setShareClasses] = useShareClasses()

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
              shareClasses.selected === item.id && "bg-muted"
            )}
            onClick={() =>
              setShareClasses({
                ...shareClasses,
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
                    shareClasses.selected === item.id
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