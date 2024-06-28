import { useTheme } from "next-themes";

export const EffectiveTheme = () => {
  const { theme, resolvedTheme } = useTheme();

  if (theme === "system") {
    return resolvedTheme;
  }

  return theme;
};
