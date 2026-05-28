'use client';

import { useState, Fragment } from 'react';
import { useChat } from '@ai-sdk/react';
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
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter as PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Spinner as Loader } from '@/components/ui/spinner';
import { SignoutButton } from '@/components/auth/signout-button';

export default function RAGChatBot() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text) return;
    sendMessage({ text: message.text });
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh)]">
      <SignoutButton />
      <div className="flex flex-col h-full">
        {/* Chat Window  */}
        <Conversation className="h-full">
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
        {/* // Input text    */}
        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </PromptInputBody>
          <PromptInputToolbar />
          {/* Model Selector, web search, extended thinking..   */}
          <PromptInputTools />
          <PromptInputSubmit />
        </PromptInput>
      </div>
    </div>
  );
}
