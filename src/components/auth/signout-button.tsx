'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export const SignoutButton = ({ className }: { className?: string }) => {
  const router = useRouter();

  const signout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push('/'),
      },
    });
  };

  return (
    <button
      type="button"
      onClick={signout}
      className={cn(
        'flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-black/4 hover:text-gray-800 dark:text-[var(--app-text-muted)] dark:hover:bg-[var(--app-surface-hover)] dark:hover:text-[var(--app-text)]',
        className,
      )}
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
};
