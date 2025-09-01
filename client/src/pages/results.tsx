import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ResultsView from "@/components/results-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ConversationResponse } from "@shared/schema";

export default function Results() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<ConversationResponse>({
    queryKey: ['/api/conversations', id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data || !data.conversation.outcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ResultsView 
        conversation={conversation}
        scenario={scenario}
        outcome={conversation.outcome!}
      />
    </div>
  );
}
