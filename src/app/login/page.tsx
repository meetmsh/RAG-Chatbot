'use client';

import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const handleGitHub = async () => {
    await authClient.signIn.social({ provider: 'github' });
  };

  const handleGoogle = async () => {
    await authClient.signIn.social({ provider: 'google' });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side */}
      <div className="flex flex-1 flex-col justify-center px-16 bg-[#f5f6fa]">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-4xl font-light text-[#3a4a6b]">Get Started</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to your account
          </p>

          <div className="mt-10 flex flex-col gap-3">
            <button
              onClick={handleGitHub}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <button
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>

      {/* Right side — system reliability showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-neutral-900 relative overflow-hidden px-12">

        {/* Subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'linear-gradient(#a78bfa 1px,transparent 1px),linear-gradient(90deg,#a78bfa 1px,transparent 1px)',backgroundSize:'32px 32px'}} />
        {/* Violet glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-64 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md">

          {/* Terminal window */}
          <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">

            {/* Title bar */}
            <div className="bg-neutral-800 px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
              <div className="size-2.5 rounded-full bg-red-500/80" />
              <div className="size-2.5 rounded-full bg-yellow-500/80" />
              <div className="size-2.5 rounded-full bg-green-500/80" />
              <span className="ml-3 text-[11px] text-neutral-500 font-mono">ragchat — incident-investigation</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-neutral-500">live</span>
              </div>
            </div>

            {/* Chat area */}
            <div className="bg-neutral-950 px-5 py-5 flex flex-col gap-4 font-mono">

              {/* User prompt */}
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-xl rounded-tr-sm bg-violet-600/90 px-3.5 py-2.5 text-xs text-white leading-relaxed shadow-lg shadow-violet-900/40">
                  Investigate the memory leak on deployment #09-A
                </div>
              </div>

              {/* AI streamed response */}
              <div className="flex gap-3 items-start">
                <div className="size-6 shrink-0 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mt-0.5">
                  <svg className="size-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="flex-1 rounded-xl rounded-tl-sm bg-neutral-800 border border-white/5 px-4 py-3 text-xs leading-relaxed">
                  <p className="text-neutral-300">
                    Analyzed <span className="text-violet-400">Vercel execution logs</span>. Similarity match found in{' '}
                    <span className="text-emerald-400">post-mortem #244</span>.
                  </p>
                  <p className="mt-1.5 text-neutral-300">
                    Memory spike correlates to unclosed database connections in edge function{' '}
                    <span className="text-amber-400">/api/analytics</span> at{' '}
                    <span className="text-red-400">line 42</span>.
                  </p>

                  {/* Inline log lines */}
                  <div className="mt-3 rounded-lg bg-neutral-900 border border-white/5 px-3 py-2.5 flex flex-col gap-1">
                    <p className="text-[10px] text-neutral-500">&gt; <span className="text-neutral-400">_Analyzing server logs</span><span className="animate-pulse text-violet-400">▋</span></p>
                    <p className="text-[10px] text-neutral-500">&gt; <span className="text-emerald-400">Match found</span><span className="text-neutral-500">: pgvector similarity 0.94</span></p>
                    <p className="text-[10px] text-neutral-500">&gt; <span className="text-amber-400">heap_used</span><span className="text-neutral-500">: 487MB → 1.2GB over 14 min</span></p>
                  </div>

                  {/* Source badge */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-violet-400 shrink-0" />
                    <span className="text-[10px] text-neutral-500">Sourced from <span className="text-neutral-400 font-medium">db-pool-leak-2025.log</span></span>
                  </div>
                </div>
              </div>

            </div>

            {/* Input bar */}
            <div className="bg-neutral-900 border-t border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 bg-neutral-800 rounded-lg border border-white/5 px-3 py-2">
                <button className="text-neutral-600 hover:text-violet-400 transition-colors shrink-0">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32" />
                  </svg>
                </button>
                <span className="flex-1 text-[11px] text-neutral-600 font-mono">Ask about your logs, docs, incidents…</span>
                <button className="size-5 rounded-md bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors shrink-0">
                  <svg className="size-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Metric overlays */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Latency', value: '142ms', color: 'text-emerald-400' },
              { label: 'Chunks', value: '1,024', color: 'text-violet-400' },
              { label: 'Similarity', value: '0.94', color: 'text-amber-400' },
              { label: 'Tokens', value: '3.2k', color: 'text-sky-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-neutral-800/60 border border-white/5 px-3 py-2 text-center">
                <p className={`text-sm font-semibold font-mono ${color}`}>{value}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
