import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ResultsView from "@/components/results-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import AppHeader from "@/components/app-header";
import type { ConversationResponse } from "@shared/schema";

export default function Results() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<ConversationResponse>({
    queryKey: ['/api/conversations', id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0ece6" }}>
        <div className="max-w-4xl w-full">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data || !data.conversation.outcome) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0ece6" }}>
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load results or conversation is not complete.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { conversation, scenario } = data;

  return (
    <div className="min-h-screen" style={{ background: "#f0ece6" }}>
      <AppHeader />
      <ResultsView 
        conversation={conversation}
        scenario={scenario}
        outcome={conversation.outcome!}
      />
    </div>
  );
}
