"use client";

import {
  ThemeProvider as NextThemeProvider,
  ThemeProviderProps,
} from "next-themes";

export function ThemeProviderWrapper({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fatcats-theme"
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}
