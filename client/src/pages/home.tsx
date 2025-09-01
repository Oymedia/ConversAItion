import SetupForm from "@/components/setup-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-4">
            <i className="fas fa-brain text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">ConversAI</h1>
          <p className="text-muted-foreground text-lg">Practice real-life conversations through AI-powered simulations</p>
        </div>
        
        <SetupForm />
      </div>
    </div>
  );
}
