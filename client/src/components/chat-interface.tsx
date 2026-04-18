import { useEffect, useRef } from "react";
import type { Conversation, Scenario, ResponseOption } from "@shared/schema";

interface ChatInterfaceProps {
  conversation: Conversation;
  scenario: Scenario;
  responseOptions: ResponseOption[];
  isLoading?: boolean;
}

export default function ChatInterface({ conversation, scenario, responseOptions, isLoading = false }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      {/* Messages Container */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16, minHeight: 0, scrollbarWidth: "none", msOverflowStyle: "none" }} data-testid="messages-container">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 message-enter ${
              message.type === 'user' ? 'justify-end' : ''
            }`}
          >
            {message.type === 'ai' && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-sm"></i>
                </div>
              </div>
            )}
            
            <div className="flex-1 max-w-md">
              <div
                className={`rounded-2xl p-4 ${
                  message.type === 'ai'
                    ? 'bg-primary text-primary-foreground rounded-tl-md'
                    : 'bg-accent text-accent-foreground rounded-tr-md ml-auto'
                }`}
                data-testid={`message-${message.type}-${message.id}`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
              <div 
                className={`text-xs text-muted-foreground mt-1 ${
                  message.type === 'user' ? 'mr-2 text-right' : 'ml-2'
                }`}
                data-testid={`message-timestamp-${message.id}`}
              >
                Exchange {message.exchangeNumber} - {message.approach && `${message.approach.charAt(0).toUpperCase() + message.approach.slice(1)} Response - `}Just now
              </div>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-sm"></i>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-sm"></i>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="bg-primary/20 text-primary rounded-2xl rounded-tl-md p-4">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Response Options are now in the right panel */}
    </main>
  );
}
