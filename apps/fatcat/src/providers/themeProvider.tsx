"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

export function ThemeProviderWrapper({

                                       ...props
                                     }) {
  return (
      <NextThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="fatcats-theme" // Add this to persist theme preference
          {...props}
      >

      </NextThemeProvider>
  );
}