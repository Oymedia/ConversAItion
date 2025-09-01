export interface ConversationState {
  isLoading: boolean;
  error: string | null;
}

export interface SimulationProgress {
  current: number;
  total: number;
  percentage: number;
}
