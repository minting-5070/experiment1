'use client';

import { useRef, useEffect } from 'react';

type Props = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
};

export default function ChatInput({ input, handleInputChange, handleSubmit, isLoading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-4 p-6 bg-background border border-border rounded-2xl shadow-lg">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).form?.requestSubmit();
              }
            }}
            disabled={isLoading}
            placeholder="Search for papers, ask questions, or get help with citations..."
            className="w-full resize-none border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-lg leading-relaxed max-h-40 overflow-y-auto"
            rows={2}
            style={{ minHeight: '56px' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
            isLoading || !input.trim()
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md'
          }`}
          title="Send (Enter)"
        >
          {isLoading ? (
            <div className="spinner w-5 h-5" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}