"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/button"

const ThemeSwitcher = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  if (!mounted) {
    return null;
  }

  return (
      <Button
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
          onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
      >
        {resolvedTheme === "light" ? (
            <MoonIcon className="h-6 w-6" />
        ) : (
            <SunIcon className="h-6 w-6" />
        )}
      </Button>
  );
};

export default ThemeSwitcher;

