"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProviderWrapper({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      // @ts-ignore
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fatcats-theme"
      {...props}
    >
      {children as any}
    </NextThemeProvider>
  );
}
