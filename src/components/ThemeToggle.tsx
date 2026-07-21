"use client";

import { useTheme } from "@/components/ThemeProvider";
import type { Theme } from "@/components/ThemeProvider";

const themes: Array<{ id: Theme; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "cyber", label: "Cyber" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-black/10 p-0.5 dark:border-white/10">
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          aria-pressed={theme === t.id}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            theme === t.id
              ? "bg-foreground text-background"
              : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
