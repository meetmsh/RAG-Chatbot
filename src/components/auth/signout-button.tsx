'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
      title="Sign out"
      aria-label="Sign out"
      className={cn(
        'flex items-center gap-1.5 rounded-lg text-app-muted transition-colors hover:bg-app-hover hover:text-app-text',
        iconOnly ? 'size-8 shrink-0 justify-center' : 'w-full px-3 py-2 text-sm',
        className,
      )}
    >
      <LogOut className="size-4" />
      {iconOnly ? null : 'Sign out'}
    </button>
  );
};
