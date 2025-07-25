'use client';

import { useRef, useEffect } from 'react';

type Props = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean; // isLoading은 useChat에서 제공될 수 있습니다.
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
      <div className="flex items-end gap-2 p-4 bg-background border border-border rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // form의 onSubmit을 트리거하기 위해 form을 직접 submit합니다.
                (e.target as HTMLTextAreaElement).form?.requestSubmit();
              }
            }}
            disabled={isLoading}
            placeholder="메시지를 입력하세요... (Shift + Enter로 줄바꿈)"
            className="w-full resize-none border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-sm leading-6 max-h-32 overflow-y-auto"
            rows={1}
            style={{ minHeight: '24px' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
            isLoading || !input.trim()
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
          }`}
          title="전송 (Enter)"
        >
          {isLoading ? (
            <div className="spinner w-4 h-4" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Enter로 전송, Shift + Enter로 줄바꿈
      </div>
    </form>
  );
}
