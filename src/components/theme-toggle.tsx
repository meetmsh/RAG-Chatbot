'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — theme is only known on the client.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
      title={isDark ? 'Use light theme' : 'Use dark theme'}
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative h-7 w-14 cursor-pointer rounded-full border border-app-line bg-app-hover/70 transition-[background-color,border-color] duration-200 hover:border-app-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-teal/40"
    >
      <span
        className={cn(
          'absolute top-[3px] left-[3px] flex size-5 items-center justify-center rounded-full bg-app-text text-app-bg shadow-sm transition-transform duration-200 ease-out',
          mounted && isDark && 'translate-x-7',
        )}
      >
        {mounted ? (
          isDark ? (
            <Moon className="size-3" strokeWidth={2} />
          ) : (
            <Sun className="size-3" strokeWidth={2} />
          )
        ) : null}
      </span>
    </button>
  );
}
