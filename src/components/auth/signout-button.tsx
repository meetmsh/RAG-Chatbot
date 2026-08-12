'use client';

import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export const SignoutButton = ({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace('/');
          },
          onError: () => setIsSigningOut(false),
        },
      });
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={signout}
      onPointerEnter={() => router.prefetch('/')}
      onFocus={() => router.prefetch('/')}
      disabled={isSigningOut}
      title={isSigningOut ? 'Signing out' : 'Sign out'}
      aria-label={isSigningOut ? 'Signing out' : 'Sign out'}
      aria-busy={isSigningOut}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 rounded-[6px] text-app-muted transition-[color,opacity] duration-150 hover:text-app-text disabled:cursor-wait disabled:opacity-50',
        iconOnly
          ? 'size-8 shrink-0 justify-center'
          : 'w-full px-3 py-2 text-sm',
        className,
      )}
    >
      {isSigningOut ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
      ) : (
        <LogOut className="size-4" strokeWidth={1.8} />
      )}
      {iconOnly ? null : isSigningOut ? 'Signing out...' : 'Sign out'}
    </button>
  );
};
