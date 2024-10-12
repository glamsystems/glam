import React, { useEffect, useRef, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface CustomSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
}

const getGradient = (value: number, isLightMode: boolean) => {
  const startColor = isLightMode ? [228, 228, 231] : [37, 37, 40];
  const endColor = isLightMode ? [159, 18, 57] : [241, 113, 133];

  const r = Math.round(
    startColor[0] + (endColor[0] - startColor[0]) * (value / 100)
  );
  const g = Math.round(
    startColor[1] + (endColor[1] - startColor[1]) * (value / 100)
  );
  const b = Math.round(
    startColor[2] + (endColor[2] - startColor[2]) * (value / 100)
  );

  return `rgb(${r}, ${g}, ${b})`;
};

export default function CustomSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
}: CustomSliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbWidth, setThumbWidth] = useState(20);
  const [isLightMode, setIsLightMode] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      const computedStyle = window.getComputedStyle(inputRef.current);
      const thumbWidth = parseInt(
        computedStyle.getPropertyValue("--thumb-width") || "20",
        10
      );
      setThumbWidth(thumbWidth);
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsLightMode(!mediaQuery.matches);
    setIsLoaded(true);

    const handler = () => setIsLightMode(!mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(Number(event.target.value));
  };

  const handleToggleChange = (newValue: string) => {
    onValueChange(Number(newValue));
  };

  const getBackgroundSize = () => {
    if (!inputRef.current) return { backgroundSize: "0% 100%" };

    const range = max - min;
    const trackWidth = inputRef.current.offsetWidth - thumbWidth;
    const thumbPosition = ((value - min) / range) * trackWidth;
    const backgroundPercentage =
      (thumbPosition / inputRef.current.offsetWidth) * 100;

    return {
      backgroundSize: `calc(${backgroundPercentage}% + ${
        thumbWidth / 2
      }px) 100%`,
    };
  };

  return (
    <div className="w-full mx-auto space-y-0">
      <div className="relative">
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={`w-full h-6 appearance-none cursor-pointer bg-input
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-[20px]
            [&::-webkit-slider-thumb]:h-[20px]
            [&::-webkit-slider-thumb]:bg-background
            [&::-webkit-slider-thumb]:dark:bg-background
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:transform
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-transparent
            [&::-moz-range-thumb]:bg-background
            [&::-moz-range-thumb]:dark:bg-background
            [&::-moz-range-thumb]:shadow-lg
            ${
              value === min
                ? "[&::-webkit-slider-thumb]:ml-0.5 [&::-moz-range-thumb]:ml-0.5"
                : ""
            }
            ${
              value === max
                ? "[&::-webkit-slider-thumb]:-translate-x-0.5 [&::-moz-range-thumb]:-translate-x-0.5"
                : ""
            }`}
          style={{
            ...getBackgroundSize(),
            ...(isLoaded
              ? {
                  background: `linear-gradient(to right, ${getGradient(
                    0,
                    isLightMode
                  )}, ${getGradient(value, isLightMode)})`,
                }
              : {}),
            ["--thumb-width" as any]: `${thumbWidth}px`,
          }}
        />
      </div>
      <ToggleGroup
        type="single"
        value={value.toString()}
        onValueChange={handleToggleChange}
        className="justify-between w-full"
      >
        {[0, 25, 50, 75, 100].map((percentage) => (
          <ToggleGroupItem
            key={percentage}
            value={percentage.toString()}
            aria-label={`${percentage}%`}
            variant="outline"
            className="
            select-none
              transition-all
              w-full
              h-6
              rounded-none
              border-rose-800
              text-rose-800
              hover:border-rose-600
              hover:text-rose-600
              hover:bg-rose-50
              data-[state=on]:border-rose-800
              data-[state=on]:text-rose-800
              data-[state=on]:bg-rose-100
              dark:border-rose-950
              dark:text-rose-950
              dark:hover:border-rose-500
              dark:hover:text-rose-500
              dark:hover:bg-rose-950
              dark:data-[state=on]:border-rose-400
              dark:data-[state=on]:text-rose-400
              dark:data-[state=on]:bg-rose-900
              dark:data-[state=on]:bg-opacity-25
            "
          >
            {percentage}%
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
