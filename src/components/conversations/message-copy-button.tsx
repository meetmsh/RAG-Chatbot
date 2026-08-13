'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type CopyState = 'idle' | 'copied' | 'error';

export function MessageCopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [state, setState] = useState<CopyState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  if (!text.trim()) return null;

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('error');
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState('idle'), 1800);
  };

  const label =
    state === 'copied'
      ? 'Copied'
      : state === 'error'
        ? 'Could not copy'
        : 'Copy message';

  return (
    <TooltipProvider delayDuration={350}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={() => void copyMessage()}
            className={cn(
              'flex size-7 cursor-pointer items-center justify-center rounded-[6px] text-app-dim transition-[background-color,color,opacity] duration-150 hover:bg-app-hover/70 hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-teal/40',
              state === 'copied' && 'text-app-teal',
              className,
            )}
          >
            {state === 'copied' ? (
              <Check className="size-3.5" strokeWidth={2} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.8} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
