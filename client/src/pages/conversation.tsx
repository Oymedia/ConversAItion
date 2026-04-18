import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import ChatInterface from "@/components/chat-interface";
import ConversationTree from "@/components/conversation-tree";
import ResponseOptions from "@/components/response-options";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ConversationResponse } from "@shared/schema";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
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
        // Note: Removed automatic redirect to results - user will click "Analyze Conversation" button instead
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

  const handleAnalyzeConversation = () => {
    setLocation(`/results/${data?.conversation?.id}`);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#f0ece6" }}>
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
    <div className="min-h-screen" style={{ background: "#f0ece6" }}>
      {/* Single clean header */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #ede8e3", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 10, fontFamily: "'Poppins', sans-serif" }}>
        {/* Left: Back + Topic */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowBackConfirm(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 20, padding: "0 4px", lineHeight: 1 }} data-testid="button-reset">←</button>
          <span style={{ fontSize: 13, color: "#999", fontWeight: 400 }} data-testid="text-scenario-purpose">{scenario?.purpose || "Conversation Practice"}</span>
        </div>
        {/* Center: Logo */}
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.01em" }}><svg width="200" height="30" viewBox="0 0 735 135" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.97 67.32C2.97 61.08 4.32 55.53 7.02 50.67C9.72 45.75 13.47 41.94 18.27 39.24C23.13 36.48 28.62 35.1 34.74 35.1C42.24 35.1 48.66 37.08 54 41.04C59.34 45 62.91 50.4 64.71 57.24H47.79C46.53 54.6 44.73 52.59 42.39 51.21C40.11 49.83 37.5 49.14 34.56 49.14C29.82 49.14 25.98 50.79 23.04 54.09C20.1 57.39 18.63 61.8 18.63 67.32C18.63 72.84 20.1 77.25 23.04 80.55C25.98 83.85 29.82 85.5 34.56 85.5C37.5 85.5 40.11 84.81 42.39 83.43C44.73 82.05 46.53 80.04 47.79 77.4H64.71C62.91 84.24 59.34 89.64 54 93.6C48.66 97.5 42.24 99.45 34.74 99.45C28.62 99.45 23.13 98.1 18.27 95.4C13.47 92.64 9.72 88.83 7.02 83.97C4.32 79.11 2.97 73.56 2.97 67.32ZM105.815 99.63C99.8747 99.63 94.4147 98.25 89.4347 95.49C84.5147 92.73 80.5847 88.89 77.6447 83.97C74.7647 78.99 73.3247 73.41 73.3247 67.23C73.3247 61.05 74.7647 55.5 77.6447 50.58C80.5847 45.66 84.5147 41.82 89.4347 39.06C94.4147 36.3 99.8747 34.92 105.815 34.92C111.755 34.92 117.185 36.3 122.105 39.06C127.085 41.82 130.985 45.66 133.805 50.58C136.685 55.5 138.125 61.05 138.125 67.23C138.125 73.41 136.685 78.99 133.805 83.97C130.925 88.89 127.025 92.73 122.105 95.49C117.185 98.25 111.755 99.63 105.815 99.63ZM105.815 85.59C110.855 85.59 114.875 83.91 117.875 80.55C120.935 77.19 122.465 72.75 122.465 67.23C122.465 61.65 120.935 57.21 117.875 53.91C114.875 50.55 110.855 48.87 105.815 48.87C100.715 48.87 96.6347 50.52 93.5747 53.82C90.5747 57.12 89.0747 61.59 89.0747 67.23C89.0747 72.81 90.5747 77.28 93.5747 80.64C96.6347 83.94 100.715 85.59 105.815 85.59ZM205.007 99H189.617L163.877 60.03V99H148.487V35.82H163.877L189.617 74.97V35.82H205.007V99ZM277.272 35.82L254.862 99H235.602L213.192 35.82H229.572L245.232 83.52L260.982 35.82H277.272ZM300.895 48.15V60.93H321.505V72.81H300.895V86.67H324.205V99H285.505V35.82H324.205V48.15H300.895ZM368.216 99L355.076 75.15H351.386V99H335.996V35.82H361.826C366.806 35.82 371.036 36.69 374.516 38.43C378.056 40.17 380.696 42.57 382.436 45.63C384.176 48.63 385.046 51.99 385.046 55.71C385.046 59.91 383.846 63.66 381.446 66.96C379.106 70.26 375.626 72.6 371.006 73.98L385.586 99H368.216ZM351.386 64.26H360.926C363.746 64.26 365.846 63.57 367.226 62.19C368.666 60.81 369.386 58.86 369.386 56.34C369.386 53.94 368.666 52.05 367.226 50.67C365.846 49.29 363.746 48.6 360.926 48.6H351.386V64.26ZM419.367 99.63C414.747 99.63 410.607 98.88 406.947 97.38C403.287 95.88 400.347 93.66 398.127 90.72C395.967 87.78 394.827 84.24 394.707 80.1H411.087C411.327 82.44 412.137 84.24 413.517 85.5C414.897 86.7 416.697 87.3 418.917 87.3C421.197 87.3 422.997 86.79 424.317 85.77C425.637 84.69 426.297 83.22 426.297 81.36C426.297 79.8 425.757 78.51 424.677 77.49C423.657 76.47 422.367 75.63 420.807 74.97C419.307 74.31 417.147 73.56 414.327 72.72C410.247 71.46 406.917 70.2 404.337 68.94C401.757 67.68 399.537 65.82 397.677 63.36C395.817 60.9 394.887 57.69 394.887 53.73C394.887 47.85 397.017 43.26 401.277 39.96C405.537 36.6 411.087 34.92 417.927 34.92C424.887 34.92 430.497 36.6 434.757 39.96C439.017 43.26 441.297 47.88 441.597 53.82H424.947C424.827 51.78 424.077 50.19 422.697 49.05C421.317 47.85 419.547 47.25 417.387 47.25C415.527 47.25 414.027 47.76 412.887 48.78C411.747 49.74 411.177 51.15 411.177 53.01C411.177 55.05 412.137 56.64 414.057 57.78C415.977 58.92 418.977 60.15 423.057 61.47C427.137 62.85 430.437 64.17 432.957 65.43C435.537 66.69 437.757 68.52 439.617 70.92C441.477 73.32 442.407 76.41 442.407 80.19C442.407 83.79 441.477 87.06 439.617 90C437.817 92.94 435.177 95.28 431.697 97.02C428.217 98.76 424.107 99.63 419.367 99.63ZM561.745 35.82V48.15H545.005V99H529.615V48.15H512.875V35.82H561.745ZM586.659 35.82V99H571.269V35.82H586.659ZM629.492 99.63C623.552 99.63 618.092 98.25 613.112 95.49C608.192 92.73 604.262 88.89 601.322 83.97C598.442 78.99 597.002 73.41 597.002 67.23C597.002 61.05 598.442 55.5 601.322 50.58C604.262 45.66 608.192 41.82 613.112 39.06C618.092 36.3 623.552 34.92 629.492 34.92C635.432 34.92 640.862 36.3 645.782 39.06C650.762 41.82 654.662 45.66 657.482 50.58C660.362 55.5 661.802 61.05 661.802 67.23C661.802 73.41 660.362 78.99 657.482 83.97C654.602 88.89 650.702 92.73 645.782 95.49C640.862 98.25 635.432 99.63 629.492 99.63ZM629.492 85.59C634.532 85.59 638.552 83.91 641.552 80.55C644.612 77.19 646.142 72.75 646.142 67.23C646.142 61.65 644.612 57.21 641.552 53.91C638.552 50.55 634.532 48.87 629.492 48.87C624.392 48.87 620.312 50.52 617.252 53.82C614.252 57.12 612.752 61.59 612.752 67.23C612.752 72.81 614.252 77.28 617.252 80.64C620.312 83.94 624.392 85.59 629.492 85.59ZM728.684 99H713.294L687.554 60.03V99H672.164V35.82H687.554L713.294 74.97V35.82H728.684V99Z" fill="black"/><path d="M493.509 99.001H445.766L469.628 57.5342L493.509 99.001ZM518.543 99.001H500.742L473.175 51.4443L482.062 35.8945L518.543 99.001Z" fill="black"/><path d="M518.543 99.001H500.743L473.176 51.4443L482.062 35.8945L518.543 99.001Z" fill="#ED1F5E"/></svg></span>
        {/* Right: Progress */}
<div style={{ width: 40 }} />
      </header>

      {showBackConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 340, width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#1a1a1a" }}>Are you sure?</p>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>Your conversation progress will be lost.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowBackConfirm(false)} style={{ padding: "10px 24px", borderRadius: 50, border: "1.5px solid #e8365d", background: "white", color: "#e8365d", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={() => setLocation("/?step=7")} style={{ padding: "10px 24px", borderRadius: 50, border: "none", background: "#e8365d", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Yes, go back</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "row", height: "calc(100vh - 58px)", background: "#f0ece6", overflow: "hidden" }} className="conversation-layout">

        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface 
            conversation={conversation}
            scenario={scenario}
            responseOptions={[]} // Don't pass options here anymore
            isLoading={respondMutation.isPending}
          />
          
          {/* Mobile Response Options or Analyze Button - Show at bottom on small screens */}
          {conversation.isComplete ? (
            <div className="lg:hidden p-4 bg-card border-t border-border">
              <Button 
                onClick={handleAnalyzeConversation}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-view-results-mobile"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Results
              </Button>
            </div>
          ) : responseOptions.length > 0 && (
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

        {/* Right Panel: Response Options or Analyze Button - Desktop only */}
        {conversation.isComplete ? (
          <div className="desktop-panel" style={{ display: "flex", flexDirection: "column", width: 320, background: "#ffffff", borderLeft: "1px solid #ede8e3", height: "100%", position: "sticky", top: 58, flexShrink: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "32px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <h3 className="text-lg font-semibold text-foreground">Conversation Complete</h3>
                <p className="text-sm text-muted-foreground" style={{ marginTop: 8 }}>Review your conversation and see the results</p>
              </div>
              <Button 
                onClick={handleAnalyzeConversation}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-view-results-desktop"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Results
              </Button>
            </div>
          </div>
        ) : responseOptions.length > 0 && (
          <div className="desktop-panel" style={{ display: "flex", flexDirection: "column", width: 320, background: "#ffffff", borderLeft: "1px solid #ede8e3", height: "100%", position: "sticky", top: 58, flexShrink: 0, overflow: "hidden" }}>
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
