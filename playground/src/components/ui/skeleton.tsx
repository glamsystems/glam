import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

const randomWidth = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const VariableWidthSkeleton = ({
  minWidth,
  maxWidth,
  height,
}: {
  minWidth: number;
  maxWidth: number;
  height: number;
}) => {
  const [width, setWidth] = useState(minWidth);

  useEffect(() => {
    setWidth(randomWidth(minWidth, maxWidth));
  }, [minWidth, maxWidth]);

  return <Skeleton style={{ width: `${width}px`, height: `${height}px` }} />;
};

export { Skeleton, VariableWidthSkeleton };
