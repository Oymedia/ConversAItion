import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Scenario } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ConversationTreeProps {
  conversation: Conversation;
  scenario: Scenario;
  showSidebar: boolean;
  onClose: () => void;
}

export default function ConversationTree({ conversation, scenario, showSidebar, onClose }: ConversationTreeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: async (exchangeNumber: number) => {
      const response = await apiRequest("POST", `/api/conversations/${conversation.id}/reset`, {
        exchangeNumber
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/conversations', conversation.id], data);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reset conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleJumpToExchange = (exchangeNumber: number) => {
    resetMutation.mutate(exchangeNumber);
  };

  // Group messages by exchange
  const exchanges = [];
  const messages = conversation.messages;
  
  for (let i = 0; i < messages.length; i += 2) {
    const aiMessage = messages[i];
    const userMessage = messages[i + 1];
    
    if (aiMessage && aiMessage.type === 'ai') {
      exchanges.push({
        exchangeNumber: aiMessage.exchangeNumber,
        aiMessage,
        userMessage: userMessage && userMessage.type === 'user' ? userMessage : null
      });
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static fixed left-0 top-0 bottom-0 z-30
          w-80 bg-card border-r border-border p-4 conversation-tree overflow-y-auto
          transition-transform duration-300 ease-in-out
        `}
        data-testid="conversation-tree-sidebar"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
              Conversation Path
            </h3>
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={onClose}
              data-testid="button-close-sidebar"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="space-y-2">
            {exchanges.map((exchange) => (
              <div key={exchange.exchangeNumber} className="border-l-2 border-primary pl-3">
                {/* AI Message */}
                <div className="bg-primary/10 rounded-md p-2">
                  <div className="text-xs text-primary font-medium mb-1">
                    Exchange {exchange.exchangeNumber} - AI
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    {exchange.aiMessage.content}
                  </p>
                </div>
                
                {/* User Response */}
                {exchange.userMessage && (
                  <div className="mt-2 bg-accent/10 rounded-md p-2 border-l-2 border-accent">
                    <div className="text-xs text-accent font-medium mb-1">
                      Your Response
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {exchange.userMessage.approach ? exchange.userMessage.approach.charAt(0).toUpperCase() + exchange.userMessage.approach.slice(1) : 'User'}: {exchange.userMessage.content}
                    </p>
                    <button
                      className="text-xs text-accent hover:underline mt-1 disabled:opacity-50"
                      onClick={() => handleJumpToExchange(exchange.exchangeNumber)}
                      disabled={resetMutation.isPending}
                      data-testid={`button-edit-exchange-${exchange.exchangeNumber}`}
                    >
                      <i className="fas fa-edit mr-1"></i>Change Response
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Current Exchange Indicator */}
            {!conversation.isComplete && (
              <div className="border-l-2 border-muted-foreground border-dashed pl-3">
                <div className="bg-muted/20 rounded-md p-2">
                  <div className="text-xs text-muted-foreground font-medium mb-1">
                    Exchange {conversation.currentExchange + 1} - AI
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Waiting for your response...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
