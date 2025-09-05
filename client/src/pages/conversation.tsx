import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import ChatInterface from "@/components/chat-interface";
import ConversationTree from "@/components/conversation-tree";
import ResponseOptions from "@/components/response-options";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ConversationResponse } from "@shared/schema";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ConversationResponse>({
    queryKey: ['/api/conversations', id],
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Move mutation hook to top level to avoid hook order issues
  const respondMutation = useMutation({
    mutationFn: async ({ approach, content }: { approach: string; content: string }) => {
      if (!data?.conversation?.id) throw new Error('No conversation ID');
      const response = await apiRequest("POST", `/api/conversations/${data.conversation.id}/respond`, {
        approach,
        content
      });
      return response.json();
    },
    onSuccess: (responseData) => {
      // Update the cache with new conversation data
      if (data?.conversation?.id) {
        queryClient.setQueryData(['/api/conversations', data.conversation.id], responseData);
        
        // If conversation is complete, redirect to results
        if (responseData.conversation.isComplete) {
          setTimeout(() => {
            setLocation(`/results/${data.conversation.id}`);
          }, 1000);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResponseSelect = (approach: string, content: string) => {
    respondMutation.mutate({ approach, content });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto p-4">
          <Skeleton className="h-16 w-full mb-4" />
          <div className="flex gap-4">
            <Skeleton className="w-80 h-96 hidden lg:block" />
            <Skeleton className="flex-1 h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load conversation. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No conversation data received. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data.conversation || !data.scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Incomplete conversation data. Please try refreshing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { conversation, scenario, responseOptions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Scenario Info */}
            <div className="flex items-center space-x-4">
              <button 
                className="lg:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setShowSidebar(!showSidebar)}
                data-testid="button-toggle-sidebar"
              >
                <i className="fas fa-bars"></i>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-foreground" data-testid="text-scenario-purpose">
                  {scenario?.purpose || 'Conversation Practice'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  AI Character: <span data-testid="text-character-type">Character Simulation</span>
                </p>
              </div>
            </div>
            
            {/* Center: Progress */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(conversation.currentExchange / 7) * 100}%` }}
                    data-testid="progress-bar"
                  ></div>
                </div>
                <span className="text-sm font-medium text-muted-foreground" data-testid="text-progress">
                  {conversation.currentExchange}/7
                </span>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              <button 
                className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => window.location.href = '/'}
                title="Reset Simulation"
                data-testid="button-reset"
              >
                <i className="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          
          {/* Mobile Progress */}
          <div className="sm:hidden mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span data-testid="text-mobile-progress">{conversation.currentExchange}/7</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(conversation.currentExchange / 7) * 100}%` }}
                data-testid="progress-bar-mobile"
              ></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex h-[calc(100vh-120px)]">
        {/* Left Sidebar: Conversation Tree */}
        <ConversationTree 
          conversation={conversation}
          scenario={scenario}
          showSidebar={showSidebar}
          onClose={() => setShowSidebar(false)}
        />
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface 
            conversation={conversation}
            scenario={scenario}
            responseOptions={[]} // Don't pass options here anymore
            isLoading={respondMutation.isPending}
          />
          
          {/* Mobile Response Options - Show at bottom on small screens */}
          {!conversation.isComplete && responseOptions.length > 0 && (
            <div className="lg:hidden">
              <ResponseOptions
                options={responseOptions}
                onSelect={handleResponseSelect}
                isLoading={respondMutation.isPending}
                conversation={conversation}
              />
            </div>
          )}
        </div>

        {/* Right Panel: Response Options - Desktop only */}
        {!conversation.isComplete && responseOptions.length > 0 && (
          <div className="hidden lg:block w-80 bg-card border-l border-border flex flex-col h-full">
            <ResponseOptions
              options={responseOptions}
              onSelect={handleResponseSelect}
              isLoading={respondMutation.isPending}
              conversation={conversation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
