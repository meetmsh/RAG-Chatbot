'use client';

import { useChat } from '@ai-sdk/react';
import { Fragment, useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse as Response,
} from '@/components/ai-elements/message';
import { SignoutButton } from '@/components/auth/signout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Spinner as Loader } from '@/components/ui/spinner';
import {
  ArrowRight,
  ImageIcon,
  Paperclip,
  PlusIcon,
  RefreshCw,
  Search,
} from 'lucide-react';

const SUGGESTION_SETS = [
  [
    'Write a to-do list for a personal project or task',
    'Generate an email reply to a job offer',
    'Summarise this article or text for me in one paragraph',
    'How does AI work in a technical capacity',
  ],
  [
    'Explain the difference between machine learning and AI',
    'Write a cover letter for a software engineer role',
    'Summarise the key points of a business meeting',
    'What are the best practices for REST API design',
  ],
  [
    'Help me brainstorm names for a startup',
    'Draft a polite follow-up email after an interview',
    'Explain quantum computing in simple terms',
    'What are the pros and cons of remote work',
  ],
];

const MOCK_THREADS = [
  { id: '1', title: 'Project architecture discussion', group: 'Today' },
  { id: '2', title: 'API integration help', group: 'Today' },
  { id: '3', title: 'Database schema review', group: 'Yesterday' },
  { id: '4', title: 'Performance optimization', group: 'Yesterday' },
  { id: '5', title: 'Authentication flow', group: '2 days ago' },
  { id: '6', title: 'UI component library', group: '3 days ago' },
  { id: '7', title: 'Deployment pipeline setup', group: '1 week ago' },
];


const MAX_CHARS = 1000;

export function ChatPage({ userName }: { userName: string }) {
  const [input, setInput] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const { messages, sendMessage, status, setMessages } = useChat();

  const firstName = userName?.split(' ')[0] ?? 'there';
  const suggestions = SUGGESTION_SETS[suggestionIndex % SUGGESTION_SETS.length];

  const submit = () => {
    if (!input.trim() || status === 'submitted' || status === 'streaming')
      return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[var(--app-bg)]">
      {/* Sidebar */}
      <aside className="w-85 shrink-0 flex flex-col border-r border-gray-200 bg-white dark:border-[var(--app-border)] dark:bg-[var(--app-bg-sidebar)]">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-400 leading-tight dark:text-[var(--app-text-dim)]">
              RAG Assistant
            </div>
          </div>
        </div>

        {/* New Chat */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setMessages([])}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:bg-black/4 hover:text-gray-800 transition-colors dark:text-[var(--app-text-muted)] dark:hover:bg-[var(--app-surface-hover)] dark:hover:text-[var(--app-text)]"
          >
            <PlusIcon className="size-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-[var(--app-surface)] dark:border dark:border-[var(--app-border)]">
            <Search className="size-4 text-gray-400 shrink-0 dark:text-[var(--app-text-dim)]" />
            <input
              placeholder="Search threads..."
              className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder:text-gray-400 dark:text-[var(--app-text)] dark:placeholder:text-[var(--app-text-dim)]"
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto px-3">
          {MOCK_THREADS.map((thread) => (
            <button
              key={thread.id}
              className="w-full text-left px-2 py-2 rounded-lg hover:bg-black/4 text-sm text-gray-600 hover:text-gray-900 truncate transition-colors dark:text-[var(--app-text-muted)] dark:hover:bg-[var(--app-surface-hover)] dark:hover:text-[var(--app-text)]"
            >
              {thread.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-[#f5f5f7] min-w-0 relative dark:bg-[var(--app-bg)]">
        {/* Atmosphere — dark only */}
        <div className="pointer-events-none absolute inset-0 z-0 hidden dark:block app-atmosphere" />

        <div className="absolute top-5 right-6 z-20 flex items-center gap-3">
          <ThemeToggle />
          <SignoutButton />
        </div>

        {messages.length === 0 ? (
          <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pt-16">
            <div className="w-full max-w-3xl mx-auto">
              <p className="text-2xl text-gray-400 mb-3 dark:text-[var(--app-text)] dark:font-semibold">
                Hi there, <span className="greeting-name">{firstName}</span>
              </p>
              <h1 className="accent-text text-4xl font-bold leading-[1.1] tracking-tight mb-5">
                What would you like to know?
              </h1>
              <p className="text-gray-400 text-sm mb-8 dark:text-[var(--app-text-dim)]">
                Use one of the most common prompts below or use your own to
                begin
              </p>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-3.5 bg-white rounded-xl border border-gray-200 text-left text-sm text-gray-700 hover:border-[#24B1B1]/40 hover:shadow-sm transition-all leading-relaxed h-24 flex flex-col justify-start dark:bg-[var(--app-surface)] dark:border-[var(--app-border)] dark:text-[var(--app-text-muted)] dark:hover:border-[var(--app-teal)]/50 dark:hover:text-[var(--app-text)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSuggestionIndex((prev) => prev + 1)}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors w-fit dark:text-[var(--app-text-dim)] dark:hover:text-[var(--app-text)]"
              >
                <RefreshCw className="size-3" />
                Refresh Prompts
              </button>
            </div>
          </div>
        ) : (
          <Conversation className="relative z-10 flex-1 px-8 py-6">
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            </Message>
                          </Fragment>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              ))}
              {(status === 'submitted' || status === 'streaming') && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        {/* Input */}
        <div className="relative z-10 px-8 pb-6">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="composer bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all dark:bg-[var(--app-surface)] dark:border-[var(--app-border)] dark:shadow-none"
            >
              <textarea
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS)
                    setInput(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message NexusAI..."
                className="w-full px-5 pt-5 pb-2 bg-transparent outline-none resize-none text-sm text-gray-700 placeholder:text-gray-400 dark:text-[var(--app-text)] dark:placeholder:text-[var(--app-text-dim)]"
                rows={2}
              />
              <div className="flex items-center gap-4 px-4 pb-4 pt-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm text-gray-400/80 hover:text-gray-600 transition-colors dark:text-[var(--app-text-dim)] dark:hover:text-[var(--app-text-muted)]"
                >
                  <Paperclip className="size-3.5" />
                  Add Attachment
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm text-gray-400/80 hover:text-gray-600 transition-colors dark:text-[var(--app-text-dim)] dark:hover:text-[var(--app-text-muted)]"
                >
                  <ImageIcon className="size-3.5" />
                  Use Image
                </button>
                <div className="flex-1" />
                <span className="text-sm text-gray-400 dark:text-[var(--app-text-dim)]">
                  {input.length}/{MAX_CHARS}
                </span>
                <button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    status === 'submitted' ||
                    status === 'streaming'
                  }
                  className="w-9 h-9 rounded-full bg-[#24B1B1] flex items-center justify-center hover:bg-[#1d9c9c] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 dark:bg-none dark:[background:var(--app-accent-gradient)] dark:disabled:opacity-45 dark:enabled:hover:scale-105"
                >
                  <ArrowRight className="size-4 text-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
