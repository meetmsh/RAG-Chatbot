import { LoginButtons } from '@/components/auth/login-buttons';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async () => {
  const session = await getSession();

  if (session) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Dark hero — top 40% on mobile, right panel on desktop */}
      <div
        className="order-1 lg:order-2 relative flex h-[42vh] flex-col justify-center overflow-hidden px-8 lg:h-auto lg:flex-1 lg:px-16"
        style={{
          background:
            'linear-gradient(180deg, #2a211c 0%, #241c18 30%, #1e1814 60%, #171210 100%)',
        }}
      >
        {/* Ambient blobs */}
        <div className="absolute -right-12 -top-12 size-56 rounded-full bg-[#e8a87c]/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 size-44 rounded-full bg-black/[0.07] blur-2xl" />

        <div className="relative z-10 mx-auto w-full max-w-sm flex flex-col gap-4 lg:gap-8">
          <h2 className="text-3xl font-bold leading-tight tracking-tight lg:text-5xl lg:leading-[1.12] lg:tracking-[-0.02em]">
            <span className="text-[#f3ede7]">Ask your documents </span>
            <span className="text-[#e8a87c]">anything</span>
          </h2>

          <div className="flex flex-col gap-3 lg:gap-6">
            <div className="flex flex-col gap-0.5 border-l-2 border-[#e8a87c]/60 pl-4">
              <span className="text-[10px] font-semibold tracking-widest text-[#e8a87c] uppercase">
                Upload
              </span>
              <span className="text-sm font-medium text-[#b5a99e] lg:text-base">
                PDF, contract, report, anything.
              </span>
            </div>
            <div className="flex flex-col gap-0.5 border-l-2 border-[#e8a87c]/60 pl-4">
              <span className="text-[10px] font-semibold tracking-widest text-[#e8a87c] uppercase">
                Ask
              </span>
              <span className="text-sm font-medium text-[#b5a99e] lg:text-base">
                Plain English questions, instant answers.
              </span>
            </div>
            <div className="flex flex-col gap-0.5 border-l-2 border-[#e8a87c]/60 pl-4">
              <span className="text-[10px] font-semibold tracking-widest text-[#e8a87c] uppercase">
                Cite
              </span>
              <span className="text-sm font-medium text-[#b5a99e] lg:text-base">
                Every answer traced back to the source.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form sheet — bottom 60% on mobile (slides up), left panel on desktop */}
      <div className="order-2 lg:order-1 relative z-10 -mt-6 flex flex-1 flex-col justify-center bg-[#F1F5F9] px-8 py-10 lg:mt-0 lg:px-16 lg:py-0">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-3xl font-light text-[#3a4a6b] lg:text-4xl">
            Get Started
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to your account
          </p>
          <LoginButtons />
        </div>
      </div>
    </div>
  );
};
