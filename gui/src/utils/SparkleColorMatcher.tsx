import React, { useMemo } from "react";

interface SparkleColorMatcherProps {
  color: string;
}

interface ColorInfo {
  paletteName: string;
  colors: string[];
}

type PaletteType = {
  [key: string]: string[];
};

const palettes: PaletteType = {
  Slate: ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"],
  Gray: ["#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937", "#111827", "#030712"],
  Zinc: ["#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"],
  Neutral: ["#fafafa", "#f5f5f5", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626", "#171717", "#0a0a0a"],
  Stone: ["#fafaf9", "#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e", "#44403c", "#292524", "#1c1917", "#0c0a09"],
  Red: ["#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"],
  Orange: ["#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12", "#431407"],
  Amber: ["#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f", "#451a03"],
  Yellow: ["#fefce8", "#fef9c3", "#fef08a", "#fde047", "#facc15", "#eab308", "#ca8a04", "#a16207", "#854d0e", "#713f12", "#422006"],
  Lime: ["#f7fee7", "#ecfccb", "#d9f99d", "#bef264", "#a3e635", "#84cc16", "#65a30d", "#4d7c0f", "#3f6212", "#365314", "#1a2e05"],
  Green: ["#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"],
  Emerald: ["#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46", "#064e3b", "#022c22"],
  Teal: ["#f0fdfa", "#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a", "#042f2e"],
  Cyan: ["#ecfeff", "#cffafe", "#a5f3fc", "#67e8f9", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63", "#083344"],
  Sky: ["#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e", "#082f49"],
  Blue: ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"],
  Indigo: ["#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81", "#1e1b4b"],
  Violet: ["#f5f3ff", "#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#2e1065"],
  Purple: ["#faf5ff", "#f3e8ff", "#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#3b0764"],
  Fuchsia: ["#fdf4ff", "#fae8ff", "#f5d0fe", "#f0abfc", "#e879f9", "#d946ef", "#c026d3", "#a21caf", "#86198f", "#701a75", "#4a044e"],
  Pink: ["#fdf2f8", "#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899", "#db2777", "#be185d", "#9d174d", "#831843", "#500724"],
  Rose: ["#fff1f2", "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337", "#4c0519"]
};

const rgbStringToArray = (color: string): number[] => {
  return color
    .match(/\d+/g)
    ?.map(Number) ?? [0, 0, 0];
};

const rgbDistance = (rgb1: number[], rgb2: number[]): number => {
  return Math.sqrt(
    (rgb1[0] - rgb2[0]) ** 2 +
    (rgb1[1] - rgb2[1]) ** 2 +
    (rgb1[2] - rgb2[2]) ** 2
  );
};

const findClosestPalette = (color: string): string => {
  const colorRgb = rgbStringToArray(color);
  let closestPalette = "";
  let closestDistance = Infinity;

  Object.entries(palettes).forEach(([paletteName, paletteColors]) => {
    paletteColors.forEach((paletteColor) => {
      const paletteRgb = hexToRgb(paletteColor);
      const distance = rgbDistance(colorRgb, paletteRgb);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPalette = paletteName;
      }
    });
  });

  return closestPalette;
};

const hexToRgb = (hex: string): number[] => {
  const bigint = parseInt(hex.substring(1), 16);
  return [bigint >> 16 & 255, bigint >> 8 & 255, bigint & 255];
};

const hexToHSL = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
};

const generateChartColors = (baseColor: string): string[] => {
  const [baseHue, baseSaturation, baseLightness] = hexToHSL(baseColor);

  return [
    `${baseHue} ${Math.min(baseSaturation, 83.2)}% 53.3%`,
    `${(baseHue + 350) % 360} ${Math.min(baseSaturation, 95)}% 68%`,
    `${(baseHue + 355) % 360} ${Math.min(baseSaturation, 92)}% 60%`,
    `${(baseHue + 349) % 360} ${Math.min(baseSaturation, 98)}% 78%`,
    `${(baseHue + 350) % 360} ${Math.min(baseSaturation, 97)}% 87%`,
  ];
};

const SparkleColorMatcher: React.FC<SparkleColorMatcherProps> = ({ color }) => {
  const colorInfo: ColorInfo = useMemo(() => {
    const closestPalette = findClosestPalette(color);
    const baseColor = palettes[closestPalette][5]; // Choose a middle color from the palette
    const chartColors = generateChartColors(baseColor);
    return {
      paletteName: closestPalette,
      colors: chartColors
    };
  }, [color]);

  return (
    <div>
      Closest Palette: {colorInfo.paletteName}
      {/* You can render color swatches or other information here if needed */}
    </div>
  );
};

export default SparkleColorMatcher;

export type { ColorInfo };
export const getColorInfo = (color: string): ColorInfo => {
  const closestPalette = findClosestPalette(color);
  const baseColor = palettes[closestPalette][5]; // Choose a middle color from the palette
  const chartColors = generateChartColors(baseColor);
  return {
    paletteName: closestPalette,
    colors: chartColors
  };
};
