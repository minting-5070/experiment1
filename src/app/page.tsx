'use client';

import { useChat } from 'ai/react';
import ChatInput from './components/ChatInput';
import ChatMessages from './components/ChatMessages';
import { useRef, useEffect, useState } from 'react';
import JournalRankingInfo from './components/JournalRankingInfo';

export default function Home() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
  } = useChat({ streamProtocol: 'text' });
  
  const [displayMessages, setDisplayMessages] = useState(messages);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 연구 모드는 항상 활성화 (자동)
  const [showJournalInfo, setShowJournalInfo] = useState(false);

  // 새 메시지가 추가될 때 자동으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  // 메시지 상태 관리
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (isLoading && lastMessage?.role === 'assistant') {
      // AI가 응답 중일 때
      setIsThinking(true);
      // 이전까지의 메시지만 표시 (스트리밍 중인 마지막 응답은 숨김)
      setDisplayMessages(messages.slice(0, -1));
    } else if (!isLoading && lastMessage?.role === 'assistant') {
      // AI 응답이 완료되었을 때
      setIsThinking(false);
      // 완성된 응답을 포함한 모든 메시지 표시
      setTimeout(() => {
        setDisplayMessages(messages);
      }, 200); // 약간의 딜레이 후 한번에 표시
    } else {
      // 사용자 메시지가 추가되었을 때
      setDisplayMessages(messages);
      setIsThinking(false);
    }
  }, [messages, isLoading]);

  const clearChat = () => {
    setMessages([]);
    setDisplayMessages([]);
    setIsThinking(false);
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="text-lg font-bold">GA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">General Assistant</h1>
                <div className="text-xs text-muted-foreground">
                  <span>AI-powered assistant</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowJournalInfo(true)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Journal Rankings & Impact Factors"
              >
                📚 Journals
              </button>
              {displayMessages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-grow flex flex-col">
            {displayMessages.length === 0 && !isThinking ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-2xl text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-lg">
                <span className="text-2xl font-bold text-white">GA</span>
                </div>
              <h1 className="text-4xl font-bold mb-4 text-foreground tracking-tight">
                General Assistant
              </h1>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-lg">
                  AI Assistant
                </span>
              </div>
              <p className="text-lg text-muted-foreground mb-12">
                Ask me anything! I'm here to help with questions, tasks, explanations, and whatever you need assistance with.
              </p>
              

              
              {/* 입력창 */}
              <div className="w-full">
                <ChatInput
                  input={input}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </div>
            </div>
              </div>
            ) : (
          <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4">
                <ChatMessages messages={displayMessages} />
                {isThinking && (
                  <div className="flex justify-start mb-4">
                    <div className="flex max-w-[80%] flex-row items-end gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 bg-muted text-muted-foreground">
                        AI
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-muted text-foreground rounded-bl-md">
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border pt-4">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
          </div>
        )}
      </div>
      
      <JournalRankingInfo
        isOpen={showJournalInfo}
        onClose={() => setShowJournalInfo(false)}
      />
    </div>
  );
}
