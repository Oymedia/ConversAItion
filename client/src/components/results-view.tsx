import { useLocation } from "wouter";
import type { Conversation, Scenario, ConversationOutcome } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ResultsViewProps {
  conversation: Conversation;
  scenario: Scenario;
  outcome: ConversationOutcome;
}

export default function ResultsView({ conversation, scenario, outcome }: ResultsViewProps) {
  const [, setLocation] = useLocation();

  const handleStartNew = () => {
    setLocation('/');
  };

  const handleExport = () => {
    const conversationText = conversation.messages
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const exportData = `Conversation Simulation Results
    
Scenario: ${scenario.purpose}
Goal: ${scenario.goal}
Character: ${scenario.characterProfile}
Topic: ${scenario.topic}

Conversation:
${conversationText}

Results:
Goal Achievement: ${outcome.goalPercentage}%
Communication Analysis: ${outcome.communicationAnalysis}

Key Insights:
${outcome.keyInsights.map(insight => `- ${insight}`).join('\n')}
`;

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-card border border-border rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent text-accent-foreground rounded-full mb-4">
            <i className="fas fa-trophy text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Conversation Complete</h2>
          <p className="text-muted-foreground">Here's how your conversation played out</p>
        </div>
        
        {/* Outcome Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
            <h3 className="font-semibold text-accent mb-2">
              <i className="fas fa-bullseye mr-2"></i>Goal Achievement
            </h3>
            <p className="text-sm text-foreground mb-2" data-testid="text-goal-achievement">
              {outcome.goalAchieved ? 'Goal Achieved' : 'Partial Success'} - {outcome.communicationAnalysis}
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-300" 
                style={{ width: `${outcome.goalPercentage}%` }}
                data-testid="progress-goal-achievement"
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-goal-percentage">
              {outcome.goalPercentage}% of goal achieved
            </p>
          </div>
          
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <h3 className="font-semibold text-primary mb-2">
              <i className="fas fa-comments mr-2"></i>Communication Style
            </h3>
            <p className="text-sm text-foreground mb-2" data-testid="text-communication-analysis">
              {outcome.communicationAnalysis}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {/* Show approaches used */}
              {Array.from(new Set(
                conversation.messages
                  .filter(msg => msg.type === 'user' && msg.approach)
                  .map(msg => msg.approach)
              )).map((approach) => (
                <span 
                  key={approach}
                  className={`px-2 py-1 text-xs rounded-full ${
                    approach === 'diplomatic' ? 'bg-blue-100 text-blue-800' :
                    approach === 'assertive' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}
                  data-testid={`badge-approach-${approach}`}
                >
                  {approach ? approach.charAt(0).toUpperCase() + approach.slice(1) : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Key Insights */}
        <div className="bg-muted/30 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">
            <i className="fas fa-lightbulb mr-2"></i>Key Insights
          </h3>
          <ul className="space-y-2 text-sm text-foreground" data-testid="list-key-insights">
            {outcome.keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-accent mt-0.5"></i>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Alternative Paths */}
        {outcome.alternativePaths.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-4">
              <i className="fas fa-route mr-2"></i>Alternative Paths You Could Try
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outcome.alternativePaths.map((path, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">{path.approach}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{path.description}</p>
                  <button 
                    className="text-primary hover:underline text-sm"
                    onClick={handleStartNew}
                    data-testid={`button-try-path-${index}`}
                  >
                    <i className="fas fa-play mr-1"></i>Try this path
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleStartNew}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-start-new"
          >
            <i className="fas fa-plus mr-2"></i>
            Start New Simulation
          </Button>
          <Button 
            variant="secondary"
            onClick={handleExport}
            data-testid="button-export-results"
          >
            <i className="fas fa-download mr-2"></i>
            Export Results
          </Button>
        </div>
      </div>
    </div>
  );
}
