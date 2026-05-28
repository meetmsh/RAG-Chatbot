import { LoginButtons } from '@/components/auth/login-buttons';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async () => {
  const session = await getSession();

  if (session) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side */}
      <div className="flex flex-1 flex-col justify-center px-16 bg-[#f5f6fa]">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-4xl font-light text-[#3a4a6b]">Get Started</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to your account
          </p>
          <LoginButtons />
        </div>
      </div>

      {/* Right side */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-[#24B1B1] overflow-hidden relative">
        <div className="relative z-10 mx-auto w-full max-w-sm flex flex-col gap-8">
          <h2 className="text-5xl font-bold leading-[1.12] tracking-[-0.02em]">
            <span className="text-white">Ask your documents </span>
            <span className="text-white/60">anything</span>
          </h2>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 border-l-2 border-white/30 pl-5">
              <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">
                Upload
              </span>
              <span className="text-base text-white font-medium">
                PDF, contract, report, anything.
              </span>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-white/30 pl-5">
              <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">
                Ask
              </span>
              <span className="text-base text-white font-medium">
                Plain English questions, instant answers.
              </span>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-white/30 pl-5">
              <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">
                Cite
              </span>
              <span className="text-base text-white font-medium">
                Every answer traced back to the source.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
