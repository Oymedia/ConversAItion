import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ResponseOption, Conversation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ResponseOptionsProps {
  options: ResponseOption[];
  onSelect: (approach: string, content: string) => void;
  isLoading: boolean;
  conversation: Conversation;
}

export default function ResponseOptions({ options, onSelect, isLoading, conversation }: ResponseOptionsProps) {
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to go back. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGoBack = () => {
    if (conversation.currentExchange > 1) {
      resetMutation.mutate(conversation.currentExchange - 1);
    }
  };

  const getApproachStyles = (approach: string) => {
    switch (approach) {
      case 'diplomatic':
        return {
          container: "bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 focus:ring-blue-500",
          icon: "bg-blue-500 text-white",
          title: "text-blue-900",
          subtitle: "text-blue-600",
          content: "text-blue-800"
        };
      case 'assertive':
        return {
          container: "bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-300 focus:ring-orange-500",
          icon: "bg-orange-500 text-white",
          title: "text-orange-900", 
          subtitle: "text-orange-600",
          content: "text-orange-800"
        };
      case 'strategic':
        return {
          container: "bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 focus:ring-green-500",
          icon: "bg-green-500 text-white",
          title: "text-green-900",
          subtitle: "text-green-600", 
          content: "text-green-800"
        };
      default:
        return {
          container: "bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 focus:ring-gray-500",
          icon: "bg-gray-500 text-white",
          title: "text-gray-900",
          subtitle: "text-gray-600",
          content: "text-gray-800"
        };
    }
  };

  const getApproachIcon = (approach: string) => {
    switch (approach) {
      case 'diplomatic':
        return "fas fa-handshake";
      case 'assertive':
        return "fas fa-shield-alt";
      case 'strategic':
        return "fas fa-chess";
      default:
        return "fas fa-comment";
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Choose your response approach:</p>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {options.map((option) => {
            const styles = getApproachStyles(option.approach);
            const icon = getApproachIcon(option.approach);
            
            return (
              <button
                key={option.approach}
                className={`response-option ${styles.container} rounded-xl p-3 text-left transition-all focus:ring-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed w-full break-words block`}
                onClick={() => onSelect(option.approach, option.content)}
                disabled={isLoading}
                data-testid={`button-response-${option.approach}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-6 h-6 ${styles.icon} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`${icon} text-xs`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium ${styles.title} text-sm`}>
                      {option.approach.charAt(0).toUpperCase() + option.approach.slice(1)}
                    </div>
                    <div className={`text-xs ${styles.subtitle} truncate`}>
                      {option.description}
                    </div>
                  </div>
                </div>
                <p className={`text-xs ${styles.content} leading-relaxed break-words overflow-hidden`}>
                  {option.content}
                </p>
              </button>
            );
          })}
        </div>
        
        {/* Back Button */}
        {conversation.currentExchange > 1 && (
          <div className="mt-4 text-center">
            <button
              className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center space-x-1 hover:underline disabled:opacity-50"
              onClick={handleGoBack}
              disabled={resetMutation.isPending || isLoading}
              data-testid="button-go-back"
            >
              <i className="fas fa-undo text-xs"></i>
              <span>Go back and choose different response</span>
            </button>
          </div>
        )}
    </div>
  );
}
